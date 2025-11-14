import { useEffect, useState, useRef } from "react";
import { useHandPointers } from "../hooks/useHandTracking";
import { isPointerNear } from "../utils/gestures";
import HandCursor from "../components/HandCursor";
import backend from "~backend/client";
import type { HandLandmarks, Player, ServerMessage } from "../types";
import { useToast } from "@/components/ui/use-toast";

interface GameLobbyProps {
  hands: HandLandmarks[];
  roomCode: string;
  username: string;
  playerId: string;
  onStartGame: () => void;
}

export default function GameLobby({
  hands,
  roomCode,
  username,
  playerId,
  onStartGame,
}: GameLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);
  const streamRef = useRef<any>(null);
  const readyButtonRef = useRef<HTMLButtonElement>(null);
  const pointers = useHandPointers(hands);
  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    connectToGame();

    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    pointers.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      if (!wasPinching && isPinching && readyButtonRef.current) {
        const rect = readyButtonRef.current.getBoundingClientRect();
        if (isPointerNear(pointer.x, pointer.y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
          handleReady();
        }
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });
  }, [pointers]);

  const connectToGame = async () => {
    try {
      const stream = await backend.game.stream({ roomCode, playerId, username });
      streamRef.current = stream;

      for await (const message of stream) {
        if (message.playersUpdate) {
          setPlayers(message.playersUpdate.players);
          const allReady = message.playersUpdate.players.every((p: Player) => p.isReady);
          if (allReady && message.playersUpdate.players.length >= 2) {
            setTimeout(() => onStartGame(), 1000);
          }
        }
      }
    } catch (err) {
      console.error("Connection error:", err);
      toast({ title: "Failed to connect to game", variant: "destructive" });
    }
  };

  const handleReady = async () => {
    if (!streamRef.current || isReady) return;

    try {
      await streamRef.current.send({ ready: { type: "ready" } });
      setIsReady(true);
    } catch (err) {
      console.error("Ready error:", err);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      {pointers.map((pointer, index) => (
        <HandCursor key={index} pointer={pointer} />
      ))}

      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Game Lobby
          </h1>
          <div className="bg-white rounded-2xl shadow-xl p-6 inline-block">
            <p className="text-gray-600 text-lg font-semibold">Room Code:</p>
            <p className="text-5xl font-black text-blue-600 tracking-wider">{roomCode}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Players ({players.length})</h2>
          
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-xl flex items-center justify-between ${
                  player.isReady
                    ? "bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-400"
                    : "bg-gray-100 border-2 border-gray-300"
                }`}
              >
                <span className="text-xl font-bold text-gray-800">{player.username}</span>
                {player.isReady && (
                  <span className="text-green-600 font-bold text-lg">✓ Ready</span>
                )}
              </div>
            ))}
          </div>

          <button
            ref={readyButtonRef}
            onClick={handleReady}
            disabled={isReady}
            className={`w-full py-6 text-3xl font-bold rounded-2xl shadow-xl transition-all ${
              isReady
                ? "bg-green-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:scale-105 active:scale-95"
            }`}
          >
            {isReady ? "✓ Ready!" : "Click to Ready"}
          </button>

          <p className="text-center text-gray-600 text-lg">
            Waiting for all players to be ready...
          </p>
        </div>
      </div>
    </div>
  );
}
