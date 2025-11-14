import { useEffect, useState, useRef } from "react";
import type { HandPointer } from "../types";
import { isPointerNear } from "../utils/gestures";

interface VirtualKeyboardProps {
  hands: HandPointer[];
  onInput: (value: string) => void;
  initialValue?: string;
}

const keys = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function VirtualKeyboard({ hands, onInput, initialValue = "" }: VirtualKeyboardProps) {
  const [value, setValue] = useState(initialValue);
  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});
  const keyRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    onInput(value);
  }, [value, onInput]);

  useEffect(() => {
    hands.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      if (!wasPinching && isPinching) {
        keyRefs.current.forEach((element, key) => {
          if (!element) return;
          const rect = element.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          if (isPointerNear(pointer.x, pointer.y, centerX, centerY, 40)) {
            handleKeyPress(key);
          }
        });
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });
  }, [hands]);

  const handleKeyPress = (key: string) => {
    if (key === "BACK") {
      setValue((prev) => prev.slice(0, -1));
    } else if (key === "SPACE") {
      setValue((prev) => prev + " ");
    } else {
      setValue((prev) => prev + key);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
      <div className="bg-gray-100 rounded-lg p-4 min-h-[60px] text-2xl font-bold text-gray-800 border-4 border-blue-300">
        {value || <span className="text-gray-400">Type here...</span>}
      </div>

      <div className="space-y-2">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((key) => (
              <button
                key={key}
                ref={(el) => {
                  if (el) keyRefs.current.set(key, el);
                }}
                className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </button>
            ))}
          </div>
        ))}

        <div className="flex justify-center gap-2 mt-4">
          <button
            ref={(el) => {
              if (el) keyRefs.current.set("BACK", el);
            }}
            className="w-32 h-14 bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => handleKeyPress("BACK")}
          >
            ← DELETE
          </button>
          <button
            ref={(el) => {
              if (el) keyRefs.current.set("SPACE", el);
            }}
            className="w-64 h-14 bg-gradient-to-br from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => handleKeyPress("SPACE")}
          >
            SPACE
          </button>
        </div>
      </div>
    </div>
  );
}
