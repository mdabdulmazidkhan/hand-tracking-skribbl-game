import { useEffect, useState, useRef } from "react";
import { useHandPointers } from "../hooks/useHandTracking";
import HandCursor from "../components/HandCursor";
import DrawingCanvas from "../components/DrawingCanvas";
import PlayerList from "../components/PlayerList";
import ChatBox from "../components/ChatBox";
import VirtualKeyboard from "../components/VirtualKeyboard";
import backend from "~backend/client";
import type { HandLandmarks, Player, DrawStroke, ChatMessage, ServerMessage } from "../types";
import { useToast } from "@/components/ui/use-toast";

interface GameRoomProps {
  hands: HandLandmarks[];
  roomCode: string;
  username: string;
  playerId: string;
  stream: any;
}

export default function GameRoom({
  hands,
  roomCode,
  username,
  playerId,
  stream: initialStream,
}: GameRoomProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentDrawerId, setCurrentDrawerId] = useState<string | null>(null);
  const [wordHint, setWordHint] = useState<string>("");
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [customWord, setCustomWord] = useState<string>("");
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  
  const streamRef = useRef<any>(null);
  const pointers = useHandPointers(hands);
  const { toast } = useToast();
  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});
  const wordButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const customWordButtonRef = useRef<HTMLButtonElement>(null);

  const isDrawing = currentDrawerId === playerId;

  useEffect(() => {
    // Receive the stream from lobby and continue consuming it
    streamRef.current = initialStream;
    listenToStream(initialStream);

    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const listenToStream = async (stream: any) => {
    try {
      for await (const message of stream) {
        if (message.playersUpdate) {
          setPlayers(message.playersUpdate.players);
        } else if (message.wordSelection) {
          setWordOptions(message.wordSelection.words);
        } else if (message.roundStart) {
          setCurrentDrawerId(message.roundStart.drawerId);
          setWordHint(message.roundStart.wordHint);
          setWordOptions([]);
          setStrokes([]);
          setTimeRemaining(message.roundStart.duration / 1000);
          const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1));
          }, 1000);
          setTimeout(() => clearInterval(interval), message.roundStart.duration);
        } else if (message.draw) {
          setStrokes((prev) => [...prev, message.draw!.stroke]);
        } else if (message.chat) {
          setMessages((prev) => [...prev, message.chat!.message]);
        } else if (message.clearCanvas) {
          setStrokes([]);
        } else if (message.correctGuess) {
          toast({
            title: `${message.correctGuess.username} guessed!`,
            className: "bg-green-500 text-white",
          });
        } else if (message.roundEnd) {
          toast({ title: `Word: ${message.roundEnd.word}` });
        } else if (message.gameEnd) {
          setGameEnded(true);
          setFinalScores(message.gameEnd.finalScores);
          toast({ title: "Game Over!" });
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      toast({ title: "Connection lost", variant: "destructive" });
    }
  };

  // Handle word selection gestures
  useEffect(() => {
    if (wordOptions.length === 0 || !isDrawing) return;

    let currentHover: string | null = null;

    pointers.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      wordButtonRefs.current.forEach((button, word) => {
        if (!button) return;
        const rect = button.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
          currentHover = word;
          if (!wasPinching && isPinching) {
            handleSelectWord(word);
          }
        }
      });

      // Check custom word button
      if (customWordButtonRef.current && customWord.trim()) {
        const rect = customWordButtonRef.current.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
          currentHover = "custom";
          if (!wasPinching && isPinching) {
            handleSelectWord(customWord.trim());
          }
        }
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });

    setHoveredWord(currentHover);
  }, [pointers, wordOptions, isDrawing, customWord]);

  const handleDrawStroke = async (stroke: DrawStroke) => {
    if (!streamRef.current || !isDrawing) return;
    try {
      await streamRef.current.send({ draw: { type: "draw", stroke } });
    } catch (err) {
      console.error("Draw error:", err);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!streamRef.current) return;
    try {
      await streamRef.current.send({ chat: { type: "chat", message } });
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const handleSelectWord = async (word: string) => {
    if (!streamRef.current) return;
    try {
      await streamRef.current.send({ selectWord: { type: "select_word", word } });
    } catch (err) {
      console.error("Word selection error:", err);
    }
  };

  const handleClearCanvas = async () => {
    if (!streamRef.current || !isDrawing) return;
    try {
      await streamRef.current.send({ clearCanvas: { type: "clear_canvas" } });
    } catch (err) {
      console.error("Clear error:", err);
    }
  };

  if (gameEnded) {
    const sortedPlayers = players
      .map(p => ({ ...p, score: finalScores[p.id] || p.score }))
      .sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
      <div className="h-full w-full flex items-center justify-center bg-[#f0f0f0] p-4">
        {pointers.map((pointer, index) => (
          <HandCursor key={index} pointer={pointer} />
        ))}
        
        <div className="bg-white border-4 border-black p-8 max-w-2xl w-full">
          <h1 className="text-2xl mb-6 text-center text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            GAME OVER!
          </h1>
          
          <div className="bg-yellow-300 border-3 border-black p-4 mb-6">
            <h2 className="text-xl text-center text-black mb-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              🏆 WINNER 🏆
            </h2>
            <p className="text-lg text-center text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              {winner.username}
            </p>
            <p className="text-md text-center text-black mt-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              {winner.score} pts
            </p>
          </div>

          <h3 className="text-sm mb-3 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            LEADERBOARD:
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex justify-between items-center p-3 border-2 border-black ${
                  player.id === playerId ? "bg-blue-100" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                    #{index + 1}
                  </span>
                  <span className="text-xs text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                    {player.username}
                  </span>
                </div>
                <span className="text-xs text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex bg-[#f0f0f0] p-2 gap-2">
      {pointers.map((pointer, index) => (
        <HandCursor key={index} pointer={pointer} />
      ))}

      <div className="w-48 flex-shrink-0">
        <PlayerList players={players} currentDrawerId={currentDrawerId} playerId={playerId} />
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="bg-white border-3 border-black p-2 flex items-center justify-between">
          <div className="text-xs text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            {isDrawing ? `DRAW` : wordHint}
          </div>
          <div className="text-sm text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            {timeRemaining}s
          </div>
        </div>

        {wordOptions.length > 0 && isDrawing && (
          <div className="bg-white border-3 border-black p-3">
            <h3 className="text-xs mb-3 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              CHOOSE WORD:
            </h3>
            <div className="flex gap-2 mb-3">
              {wordOptions.map((word) => (
                <button
                  key={word}
                  ref={(el) => {
                    if (el) wordButtonRefs.current.set(word, el);
                  }}
                  onClick={() => handleSelectWord(word)}
                  className={`flex-1 py-2 text-white text-xs border-3 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                    hoveredWord === word ? "bg-[#42A5F5] scale-105 shadow-lg" : "bg-[#2196F3]"
                  }`}
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  {word}
                </button>
              ))}
            </div>
            <div className="border-t-2 border-black pt-3">
              <h3 className="text-xs mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                OR CUSTOM:
              </h3>
              <div className="mb-2">
                <VirtualKeyboard hands={pointers} onInput={setCustomWord} initialValue="" />
              </div>
              {customWord.trim() && (
                <button
                  ref={customWordButtonRef}
                  onClick={() => handleSelectWord(customWord.trim())}
                  className={`w-full py-2 text-white text-xs border-3 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                    hoveredWord === "custom" ? "bg-[#66BB6A] scale-105 shadow-lg" : "bg-[#4CAF50]"
                  }`}
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  USE: {customWord.trim().toUpperCase()}
                </button>
              )}
            </div>
          </div>
        )}

        <DrawingCanvas
          hands={pointers}
          strokes={strokes}
          isDrawing={isDrawing}
          onDrawStroke={handleDrawStroke}
          onClear={handleClearCanvas}
          playerId={playerId}
        />
      </div>

      <div className="w-64 flex-shrink-0">
        <ChatBox
          hands={pointers}
          messages={messages}
          onSendMessage={handleSendMessage}
          disabled={isDrawing}
        />
      </div>
    </div>
  );
}
