import type { HandPointer } from "../types";

interface HandCursorProps {
  pointer: HandPointer;
}

export default function HandCursor({ pointer }: HandCursorProps) {
  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: pointer.x,
        top: pointer.y,
        transform: "translate(-50%, -50%)",
        imageRendering: "pixelated",
      }}
    >
      <div className={`relative ${pointer.isPinching ? "scale-90" : "scale-100"} transition-transform duration-100`}>
        {/* Pixel art hand cursor */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 16 16"
          style={{ imageRendering: "pixelated" }}
        >
          {/* Hand outline */}
          <rect x="6" y="4" width="4" height="8" fill={pointer.hand === "left" ? "#4CAF50" : "#f44336"} stroke="#000" strokeWidth="0.5" />
          <rect x="5" y="5" width="2" height="6" fill={pointer.hand === "left" ? "#4CAF50" : "#f44336"} stroke="#000" strokeWidth="0.5" />
          <rect x="10" y="5" width="2" height="6" fill={pointer.hand === "left" ? "#4CAF50" : "#f44336"} stroke="#000" strokeWidth="0.5" />
          {/* Thumb */}
          <rect x="4" y="7" width="2" height="4" fill={pointer.hand === "left" ? "#4CAF50" : "#f44336"} stroke="#000" strokeWidth="0.5" />
          {/* Fingers */}
          <rect x="6" y="2" width="1" height="3" fill={pointer.hand === "left" ? "#4CAF50" : "#f44336"} stroke="#000" strokeWidth="0.5" />
          <rect x="7.5" y="1" width="1" height="4" fill={pointer.hand === "left" ? "#4CAF50" : "#f44336"} stroke="#000" strokeWidth="0.5" />
          <rect x="9" y="2" width="1" height="3" fill={pointer.hand === "left" ? "#4CAF50" : "#f44336"} stroke="#000" strokeWidth="0.5" />
          
          {/* Highlight */}
          <rect x="7" y="5" width="2" height="1" fill="rgba(255,255,255,0.4)" />
        </svg>
        
        {/* Pinch indicator */}
        {pointer.isPinching && (
          <div className="absolute -top-1 -right-1">
            <svg width="12" height="12" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
              <rect x="2" y="2" width="4" height="4" fill="#FFEB3B" stroke="#000" strokeWidth="0.5" />
              <rect x="3" y="3" width="2" height="2" fill="#FFF9C4" />
            </svg>
          </div>
        )}
        
        {/* Click effect */}
        {pointer.isPinching && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-yellow-400 rounded-full animate-ping opacity-75" style={{ borderStyle: "dashed" }} />
          </div>
        )}
      </div>
      
      {/* Label */}
      <div 
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 bg-black text-white border-2 border-white whitespace-nowrap"
        style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "6px" }}
      >
        {pointer.hand.toUpperCase()}
      </div>
    </div>
  );
}
