import { useEffect, useState, useRef } from "react";
import { useHandPointers } from "../hooks/useHandTracking";
import HandCursor from "../components/HandCursor";
import DrawingCanvas from "../components/DrawingCanvas";
import PlayerList from "../components/PlayerList";
import ChatBox from "../components/ChatBox";
import backend from "~backend/client";
import type { HandLandmarks, Player, DrawStroke, ChatMessage, ServerMessage } from "../types";
import { useToast } from "@/components/ui/use-toast";

interface GameRoomProps {
  hands: HandLandmarks[];
  roomCode: string;
  username: string;
  playerId: string;
}

export default function GameRoom({
  hands,
  roomCode,
  username,
  playerId,
}: GameRoomProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentDrawerId, setCurrentDrawerId] = useState<string | null>(null);
  const [wordHint, setWordHint] = useState<string>("");
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const streamRef = useRef<any>(null);
  const pointers = useHandPointers(hands);
  const { toast } = useToast();

  const isDrawing = currentDrawerId === playerId;

  useEffect(() => {
    connectToGame();

    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const connectToGame = async () => {
    try {
      const stream = await backend.game.stream({ roomCode, playerId, username });
      streamRef.current = stream;

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
          toast({ title: "Game Over!" });
        }
      }
    } catch (err) {
      console.error("Connection error:", err);
      toast({ title: "Failed to connect", variant: "destructive" });
    }
  };

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
            <h3 className="text-xs mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              CHOOSE WORD:
            </h3>
            <div className="flex gap-2">
              {wordOptions.map((word) => (
                <button
                  key={word}
                  onClick={() => handleSelectWord(word)}
                  className="flex-1 py-2 bg-[#2196F3] hover:bg-[#1976D2] text-white text-xs border-3 border-black active:translate-x-0.5 active:translate-y-0.5"
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  {word}
                </button>
              ))}
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
