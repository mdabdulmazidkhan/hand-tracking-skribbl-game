import { useRef, useEffect, useState } from "react";
import type { HandPointer, DrawStroke } from "../types";
import { isPointerNear } from "../utils/gestures";

interface DrawingCanvasProps {
  hands: HandPointer[];
  strokes: DrawStroke[];
  isDrawing: boolean;
  onDrawStroke: (stroke: DrawStroke) => void;
  onClear: () => void;
  playerId: string;
}

const colors = ["#000", "#fff", "#f44336", "#4CAF50", "#2196F3", "#FFEB3B", "#FF9800"];
const sizes = [2, 5, 10];

export default function DrawingCanvas({
  hands,
  strokes,
  isDrawing,
  onDrawStroke,
  onClear,
  playerId,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentColor, setCurrentColor] = useState("#000");
  const [currentSize, setCurrentSize] = useState(5);
  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);
  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});

  const colorButtonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const sizeButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const clearButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  useEffect(() => {
    if (!isDrawing) return;

    hands.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      if (!wasPinching && isPinching) {
        handleToolClick(pointer.x, pointer.y);
      }

      if (isPinching && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = pointer.x - rect.left;
        const y = pointer.y - rect.top;

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          if (!isCurrentlyDrawing) {
            setIsCurrentlyDrawing(true);
            setCurrentStroke([{ x, y }]);
          } else {
            setCurrentStroke((prev) => [...prev, { x, y }]);
          }
        }
      } else if (!isPinching && isCurrentlyDrawing) {
        if (currentStroke.length > 1) {
          onDrawStroke({
            playerId,
            points: currentStroke,
            color: currentColor,
            width: currentSize,
          });
        }
        setIsCurrentlyDrawing(false);
        setCurrentStroke([]);
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });
  }, [hands, isDrawing, currentColor, currentSize, isCurrentlyDrawing, currentStroke]);

  const handleToolClick = (x: number, y: number) => {
    colorButtonsRef.current.forEach((button, color) => {
      if (!button) return;
      const rect = button.getBoundingClientRect();
      if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 30)) {
        setCurrentColor(color);
      }
    });

    sizeButtonsRef.current.forEach((button, size) => {
      if (!button) return;
      const rect = button.getBoundingClientRect();
      if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 30)) {
        setCurrentSize(size);
      }
    });

    if (clearButtonRef.current) {
      const rect = clearButtonRef.current.getBoundingClientRect();
      if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 40)) {
        onClear();
      }
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });

    if (currentStroke.length > 1) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }

      ctx.stroke();
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [currentStroke]);

  return (
    <div className="flex-1 bg-white border-3 border-black p-2 flex flex-col">
      {isDrawing && (
        <div className="flex gap-2 mb-2 items-center">
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                ref={(el) => {
                  if (el) colorButtonsRef.current.set(color, el);
                }}
                onClick={() => setCurrentColor(color)}
                className={`w-8 h-8 border-2 border-black ${
                  currentColor === color ? "ring-2 ring-blue-500" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-black" />

          <div className="flex gap-1">
            {sizes.map((size) => (
              <button
                key={size}
                ref={(el) => {
                  if (el) sizeButtonsRef.current.set(size, el);
                }}
                onClick={() => setCurrentSize(size)}
                className={`w-8 h-8 border-2 border-black bg-white flex items-center justify-center ${
                  currentSize === size ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div
                  className="bg-black"
                  style={{ 
                    width: size * 2, 
                    height: size * 2,
                    imageRendering: "pixelated"
                  }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-black" />

          <button
            ref={clearButtonRef}
            onClick={onClear}
            className="px-2 py-1 border-2 border-black bg-[#f44336] text-white text-xs hover:bg-[#d32f2f]"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            CLR
          </button>
        </div>
      )}

      <div className="flex-1 relative bg-white border-2 border-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}
