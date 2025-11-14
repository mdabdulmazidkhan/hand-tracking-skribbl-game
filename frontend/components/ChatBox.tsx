import { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { HandPointer, ChatMessage } from "../types";
import VirtualKeyboard from "./VirtualKeyboard";
import { isPointerNear } from "../utils/gestures";

interface ChatBoxProps {
  hands: HandPointer[];
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatBox({ hands, messages, onSendMessage, disabled }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (disabled) return;

    hands.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      if (!wasPinching && isPinching) {
        if (inputRef.current && !showKeyboard) {
          const rect = inputRef.current.getBoundingClientRect();
          if (isPointerNear(pointer.x, pointer.y, rect.left + rect.width / 2, rect.top + rect.height / 2, 60)) {
            setShowKeyboard(true);
          }
        }

        if (sendButtonRef.current && !showKeyboard && input.trim()) {
          const rect = sendButtonRef.current.getBoundingClientRect();
          if (isPointerNear(pointer.x, pointer.y, rect.left + rect.width / 2, rect.top + rect.height / 2, 40)) {
            handleSend();
          }
        }
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });
  }, [hands, showKeyboard, input, disabled]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="h-full bg-white rounded-2xl shadow-xl p-6 flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat</h2>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              msg.isCorrectGuess
                ? "bg-green-100 border-2 border-green-400"
                : "bg-gray-100"
            }`}
          >
            <div className="font-bold text-sm text-gray-700">{msg.username}</div>
            <div className={msg.isCorrectGuess ? "text-green-700 font-bold" : "text-gray-800"}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!disabled && (
        <div className="space-y-2">
          <div
            ref={inputRef}
            onClick={() => setShowKeyboard(true)}
            className="bg-gray-100 rounded-lg p-3 min-h-[50px] text-gray-800 border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
          >
            {input || <span className="text-gray-400">Tap to type...</span>}
          </div>

          <button
            ref={sendButtonRef}
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:scale-100 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      )}

      {showKeyboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
          <div className="relative">
            <button
              onClick={() => setShowKeyboard(false)}
              className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-xl shadow-lg z-50"
            >
              ✕
            </button>
            <VirtualKeyboard
              hands={hands}
              onInput={setInput}
              initialValue={input}
            />
          </div>
        </div>
      )}
    </div>
  );
}
