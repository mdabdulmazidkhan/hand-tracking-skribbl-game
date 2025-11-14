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
    <div className="h-full w-full flex items-center justify-center p-4 bg-[#f0f0f0]">
      {pointers.map((pointer, index) => (
        <HandCursor key={index} pointer={pointer} />
      ))}

      <div className="max-w-2xl w-full space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            LOBBY
          </h2>
          <div className="bg-white border-4 border-black p-4 inline-block">
            <p className="text-xs text-gray-600" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              CODE:
            </p>
            <p className="text-3xl text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              {roomCode}
            </p>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-4 space-y-3">
          <h3 className="text-xs mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            PLAYERS ({players.length})
          </h3>
          
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-3 border-3 border-black flex items-center justify-between ${
                  player.isReady ? "bg-[#4CAF50] text-white" : "bg-white text-black"
                }`}
              >
                <span className="text-xs" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                  {player.username}
                </span>
                {player.isReady && (
                  <span className="text-xs" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            ref={readyButtonRef}
            onClick={handleReady}
            disabled={isReady}
            className={`w-full py-4 border-4 border-black text-xs ${
              isReady
                ? "bg-[#4CAF50] text-white cursor-not-allowed"
                : "bg-[#2196F3] text-white hover:bg-[#1976D2] active:translate-x-0.5 active:translate-y-0.5"
            }`}
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {isReady ? "READY!" : "READY?"}
          </button>

          <p className="text-center text-gray-600 text-xs pt-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            Wait for players...
          </p>
        </div>
      </div>
    </div>
  );
}
