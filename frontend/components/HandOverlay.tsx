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
      const color = hand.handedness === "Left" ? "#00FF00" : "#FF0000";

      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = hand.landmarks[startIdx];
        const end = hand.landmarks[endIdx];

        if (!start || !end) return;

        ctx.beginPath();
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      hand.landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          5,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}
