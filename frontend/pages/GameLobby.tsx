import { useEffect, useState, useRef } from "react";
import { useHandPointers } from "../hooks/useHandTracking";
import HandCursor from "../components/HandCursor";
import DrawingCanvas from "../components/DrawingCanvas";
import backend from "~backend/client";
import type { HandLandmarks, Player, ServerMessage, DrawStroke } from "../types";
import { useToast } from "@/components/ui/use-toast";

interface GameLobbyProps {
  hands: HandLandmarks[];
  roomCode: string;
  username: string;
  playerId: string;
  onStartGame: (stream: any, setHandler: any) => void;
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
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [practiceStrokes, setPracticeStrokes] = useState<DrawStroke[]>([]);
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
    let currentHover: string | null = null;

    pointers.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      if (readyButtonRef.current && !isReady) {
        const rect = readyButtonRef.current.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
          currentHover = "ready";
          if (!wasPinching && isPinching) {
            handleReady();
          }
        }
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });

    setHoveredElement(currentHover);
  }, [pointers, isReady]);

  const connectToGame = async () => {
    try {
      const stream = await backend.game.stream({ roomCode, playerId, username });
      streamRef.current = stream;
      let gameStarted = false;

      for await (const message of stream) {
        // Forward message to GameRoom if it's started
        if (gameStarted) {
          const handler = (window as any).__gameRoomMessageHandler;
          if (handler) {
            handler(message);
          }
          continue;
        }

        // Lobby handling
        if (message.playersUpdate) {
          setPlayers(message.playersUpdate.players);
          const allReady = message.playersUpdate.players.every((p: Player) => p.isReady);
          if (allReady && message.playersUpdate.players.length >= 2 && !gameStarted) {
            // Transition to game room immediately
            onStartGame(stream, () => {});
            // Wait for GameRoom to mount and register handler before forwarding messages
            setTimeout(() => {
              gameStarted = true;
            }, 100);
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

  const handlePracticeStroke = (stroke: DrawStroke) => {
    setPracticeStrokes((prev) => [...prev, stroke]);
  };

  const handleClearPractice = () => {
    setPracticeStrokes([]);
  };

  return (
    <div className="h-full w-full flex bg-[#f0f0f0] p-2 gap-2">
      {pointers.map((pointer, index) => (
        <HandCursor key={index} pointer={pointer} />
      ))}

      <div className="w-64 flex-shrink-0 bg-white border-4 border-black p-4 space-y-4">
        <div className="text-center">
          <h2 className="text-xl mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            LOBBY
          </h2>
          <div className="bg-[#f0f0f0] border-3 border-black p-3">
            <p className="text-xs text-gray-600" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              CODE:
            </p>
            <p className="text-2xl text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              {roomCode}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            PLAYERS ({players.length})
          </h3>
          
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-2 border-3 border-black flex items-center justify-between ${
                  player.isReady ? "bg-[#4CAF50] text-white" : "bg-white text-black"
                }`}
              >
                <span className="text-xs truncate" style={{ fontFamily: "'Press Start 2P', cursive" }}>
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
            className={`w-full py-3 border-4 border-black text-xs active:translate-x-0.5 active:translate-y-0.5 transition-all ${
              isReady
                ? "bg-[#4CAF50] text-white cursor-not-allowed"
                : hoveredElement === "ready"
                ? "bg-[#42A5F5] text-white scale-105 shadow-lg"
                : "bg-[#2196F3] text-white"
            }`}
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {isReady ? "READY!" : "READY?"}
          </button>

          {players.length < 2 && (
            <p className="text-center text-gray-600 text-xs pt-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              Need 2+ players
            </p>
          )}
          {players.length >= 2 && !isReady && (
            <p className="text-center text-gray-600 text-xs pt-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              Click ready!
            </p>
          )}
          {isReady && (
            <p className="text-center text-gray-600 text-xs pt-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              Waiting...
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="bg-white border-3 border-black p-3 text-center">
          <h3 className="text-sm text-black mb-1" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            PRACTICE MODE
          </h3>
          <p className="text-xs text-gray-600" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            Draw while waiting for players
          </p>
        </div>

        <DrawingCanvas
          hands={pointers}
          strokes={practiceStrokes}
          isDrawing={true}
          onDrawStroke={handlePracticeStroke}
          onClear={handleClearPractice}
          playerId={playerId}
        />
      </div>
    </div>
  );
}
