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
    <div className="bg-white border-4 border-black p-4 space-y-3">
      <div className="bg-[#f0f0f0] border-3 border-black p-2 min-h-[50px] text-sm text-black break-all" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        {value || <span className="text-gray-400">Type...</span>}
      </div>

      <div className="space-y-2">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                ref={(el) => {
                  if (el) keyRefs.current.set(key, el);
                }}
                className="w-10 h-10 border-3 border-black bg-white hover:bg-gray-200 text-black text-xs active:translate-x-0.5 active:translate-y-0.5"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </button>
            ))}
          </div>
        ))}

        <div className="flex justify-center gap-2 mt-2">
          <button
            ref={(el) => {
              if (el) keyRefs.current.set("BACK", el);
            }}
            className="w-24 h-10 border-3 border-black bg-[#f44336] hover:bg-[#d32f2f] text-white text-xs active:translate-x-0.5 active:translate-y-0.5"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
            onClick={() => handleKeyPress("BACK")}
          >
            DEL
          </button>
          <button
            ref={(el) => {
              if (el) keyRefs.current.set("SPACE", el);
            }}
            className="w-48 h-10 border-3 border-black bg-[#9E9E9E] hover:bg-[#757575] text-white text-xs active:translate-x-0.5 active:translate-y-0.5"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
            onClick={() => handleKeyPress("SPACE")}
          >
            SPACE
          </button>
        </div>
      </div>
    </div>
  );
}
