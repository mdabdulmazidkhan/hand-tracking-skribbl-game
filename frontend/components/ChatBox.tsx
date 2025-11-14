import { useRef, useEffect, useState } from "react";
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
    <div className="h-full bg-white border-3 border-black p-3 flex flex-col">
      <h2 className="text-xs mb-3 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        CHAT
      </h2>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 border-2 border-black ${
              msg.isCorrectGuess ? "bg-[#4CAF50] text-white" : "bg-[#f0f0f0] text-black"
            }`}
          >
            <div className="text-xs mb-1" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              {msg.username}:
            </div>
            <div className="text-xs" style={{ fontFamily: "'Press Start 2P', cursive" }}>
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
            className="bg-white border-2 border-black p-2 min-h-[40px] text-xs cursor-pointer"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            {input || <span className="text-gray-400">Type...</span>}
          </div>

          <button
            ref={sendButtonRef}
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-full py-2 border-3 border-black bg-[#4CAF50] hover:bg-[#45a049] disabled:bg-gray-300 text-white text-xs active:translate-x-0.5 active:translate-y-0.5"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            SEND
          </button>
        </div>
      )}

      {showKeyboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
          <div className="relative">
            <button
              onClick={() => setShowKeyboard(false)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-[#f44336] border-2 border-black text-white text-xl"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              X
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
