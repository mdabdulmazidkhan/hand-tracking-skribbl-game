import { Hand } from "lucide-react";
import type { HandPointer } from "../types";

interface HandCursorProps {
  pointer: HandPointer;
}

export default function HandCursor({ pointer }: HandCursorProps) {
  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75"
      style={{
        left: pointer.x,
        top: pointer.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className={`relative ${pointer.isPinching ? "scale-75" : "scale-100"} transition-transform`}>
        <Hand
          className={`w-8 h-8 ${
            pointer.hand === "left" ? "text-blue-500" : "text-purple-500"
          } drop-shadow-lg ${pointer.isPinching ? "fill-current" : ""}`}
        />
        {pointer.isPinching && (
          <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 animate-pulse" />
        )}
      </div>
    </div>
  );
}
