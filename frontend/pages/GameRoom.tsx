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
  const [roundWord, setRoundWord] = useState<string>("");
  
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
            title: `${message.correctGuess.username} guessed the word!`,
            className: "bg-green-500 text-white",
          });
        } else if (message.roundEnd) {
          setRoundWord(message.roundEnd.word);
          toast({ title: `The word was: ${message.roundEnd.word}` });
          setTimeout(() => setRoundWord(""), 5000);
        } else if (message.gameEnd) {
          toast({ title: "Game Over!" });
        }
      }
    } catch (err) {
      console.error("Connection error:", err);
      toast({ title: "Failed to connect to game", variant: "destructive" });
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
    <div className="h-full w-full flex p-4 gap-4">
      {pointers.map((pointer, index) => (
        <HandCursor key={index} pointer={pointer} />
      ))}

      <div className="w-64 flex-shrink-0">
        <PlayerList players={players} currentDrawerId={currentDrawerId} playerId={playerId} />
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-xl p-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-800">
            {isDrawing ? `You are drawing: ${roundWord || "Select a word"}` : `Guess the word: ${wordHint}`}
          </div>
          <div className="text-3xl font-black text-blue-600">
            ⏱️ {timeRemaining}s
          </div>
        </div>

        {wordOptions.length > 0 && isDrawing && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Choose a word:</h3>
            <div className="flex gap-4">
              {wordOptions.map((word) => (
                <button
                  key={word}
                  onClick={() => handleSelectWord(word)}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white text-2xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
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

      <div className="w-80 flex-shrink-0">
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
