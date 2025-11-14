import { useEffect, useRef } from "react";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import type { HandLandmarks } from "../types";

interface HandOverlayProps {
  hands: HandLandmarks[];
}

export default function HandOverlay({ hands }: HandOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawHands();
  }, [hands]);

  const drawHands = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    hands.forEach((hand) => {
      const color = hand.handedness === "Left" ? "#4CAF50" : "#f44336";
      const outlineColor = "#000000";

      // Draw connections as pixelated lines
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = hand.landmarks[startIdx];
        const end = hand.landmarks[endIdx];

        if (!start || !end) return;

        const startX = start.x * canvas.width;
        const startY = start.y * canvas.height;
        const endX = end.x * canvas.width;
        const endY = end.y * canvas.height;

        // Black outline
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 5;
        ctx.lineCap = "square";
        ctx.stroke();

        // Colored line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = "square";
        ctx.stroke();
      });

      // Draw landmarks as pixelated squares
      hand.landmarks.forEach((landmark, index) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        const size = index === 8 || index === 4 ? 10 : 8; // Larger for index finger tip and thumb tip

        // Black outline square
        ctx.fillStyle = outlineColor;
        ctx.fillRect(x - size / 2 - 1, y - size / 2 - 1, size + 2, size + 2);

        // Colored square
        ctx.fillStyle = color;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);

        // White highlight (top-left pixel)
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillRect(x - size / 2, y - size / 2, size / 2, size / 2);
      });

      // Draw hand label
      if (hand.landmarks[9]) {
        const palmX = hand.landmarks[9].x * canvas.width;
        const palmY = hand.landmarks[9].y * canvas.height;

        ctx.font = "10px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        
        // Black outline
        ctx.fillStyle = outlineColor;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx !== 0 || dy !== 0) {
              ctx.fillText(hand.handedness.toUpperCase(), palmX + dx, palmY + dy + 20);
            }
          }
        }
        
        // White text
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(hand.handedness.toUpperCase(), palmX, palmY + 20);
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
