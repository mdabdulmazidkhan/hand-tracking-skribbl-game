import { useRef, useEffect, useState } from "react";
import type { HandPointer, DrawStroke } from "../types";

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
  const lastDrawnPointRef = useRef<{ x: number; y: number } | null>(null);
  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<Record<string, number>>({});

  const colorButtonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const sizeButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  useEffect(() => {
    if (!isDrawing) return;

    let currentHover: string | null = null;
    const now = Date.now();

    hands.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;
      const lastClick = lastClickTime[handKey] || 0;
      const timeSinceLastClick = now - lastClick;

      // Debounce clicks - minimum 100ms between clicks
      const canClick = !wasPinching && isPinching && timeSinceLastClick > 100;

      // Check if hovering over tools
      colorButtonsRef.current.forEach((button, color) => {
        if (!button) return;
        const rect = button.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
          currentHover = `color-${color}`;
          if (canClick) {
            setCurrentColor(color);
            setLastClickTime((prev) => ({ ...prev, [handKey]: now }));
          }
        }
      });

      sizeButtonsRef.current.forEach((button, size) => {
        if (!button) return;
        const rect = button.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
          currentHover = `size-${size}`;
          if (canClick) {
            setCurrentSize(size);
            setLastClickTime((prev) => ({ ...prev, [handKey]: now }));
          }
        }
      });

      if (clearButtonRef.current) {
        const rect = clearButtonRef.current.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
          currentHover = "clear";
          if (canClick) {
            onClear();
            setLastClickTime((prev) => ({ ...prev, [handKey]: now }));
          }
        }
      }

      if (undoButtonRef.current) {
        const rect = undoButtonRef.current.getBoundingClientRect();
        if (pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom) {
          currentHover = "undo";
          if (canClick) {
            handleUndo();
            setLastClickTime((prev) => ({ ...prev, [handKey]: now }));
          }
        }
      }

      // Drawing on canvas - only when NOT hovering over tools
      if (isPinching && !currentHover && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const canvasX = ((pointer.x - rect.left) / rect.width) * 1200;
        const canvasY = ((pointer.y - rect.top) / rect.height) * 800;

        if (canvasX >= 0 && canvasX <= 1200 && canvasY >= 0 && canvasY <= 800) {
          if (!isCurrentlyDrawing) {
            setIsCurrentlyDrawing(true);
            setCurrentStroke([{ x: canvasX, y: canvasY }]);
            lastDrawnPointRef.current = { x: canvasX, y: canvasY };
          } else {
            // Only add point if it's far enough from the last point (smooth drawing)
            const lastPoint = lastDrawnPointRef.current;
            if (lastPoint) {
              const distance = Math.sqrt(
                Math.pow(canvasX - lastPoint.x, 2) + Math.pow(canvasY - lastPoint.y, 2)
              );
              // Only add point if moved at least 3 pixels
              if (distance >= 3) {
                setCurrentStroke((prev) => [...prev, { x: canvasX, y: canvasY }]);
                lastDrawnPointRef.current = { x: canvasX, y: canvasY };
              }
            }
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
        lastDrawnPointRef.current = null;
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });

    setHoveredTool(currentHover);
  }, [hands, isDrawing, currentColor, currentSize, isCurrentlyDrawing, currentStroke]);

  const handleUndo = () => {
    if (strokes.length > 0) {
      const newStrokes = strokes.slice(0, -1);
      // We need to propagate this through the parent component
      // For now, we'll clear the canvas and redraw without the last stroke
      onClear();
      newStrokes.forEach((stroke) => onDrawStroke(stroke));
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

      // Use quadratic curves for smoother lines
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }

      // For the last point
      if (stroke.points.length > 1) {
        const lastPoint = stroke.points[stroke.points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }

      ctx.stroke();
    });

    if (currentStroke.length > 1) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Use quadratic curves for smoother lines
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

      for (let i = 1; i < currentStroke.length - 1; i++) {
        const xc = (currentStroke[i].x + currentStroke[i + 1].x) / 2;
        const yc = (currentStroke[i].y + currentStroke[i + 1].y) / 2;
        ctx.quadraticCurveTo(currentStroke[i].x, currentStroke[i].y, xc, yc);
      }

      // For the last point
      if (currentStroke.length > 1) {
        const lastPoint = currentStroke[currentStroke.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }

      ctx.stroke();
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [currentStroke]);

  return (
    <div className="flex-1 bg-white border-3 border-black p-2 flex flex-col">
      <div className="flex gap-2 mb-2 items-center">
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                ref={(el) => {
                  if (el) colorButtonsRef.current.set(color, el);
                }}
                onClick={() => setCurrentColor(color)}
                className={`w-8 h-8 border-2 border-black transition-transform ${
                  currentColor === color ? "ring-2 ring-blue-500" : ""
                } ${hoveredTool === `color-${color}` ? "scale-125 shadow-lg" : ""}`}
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
                className={`w-8 h-8 border-2 border-black bg-white flex items-center justify-center transition-transform ${
                  currentSize === size ? "ring-2 ring-blue-500" : ""
                } ${hoveredTool === `size-${size}` ? "scale-125 shadow-lg" : ""}`}
              >
                <div
                  className="bg-black rounded-full"
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
            ref={undoButtonRef}
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className={`px-3 py-1 border-3 border-black bg-[#FF9800] text-white text-xs hover:bg-[#F57C00] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed ${
              hoveredTool === "undo" && strokes.length > 0 ? "scale-125 shadow-xl ring-2 ring-yellow-400" : ""
            }`}
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            UNDO
          </button>

          <button
            ref={clearButtonRef}
            onClick={onClear}
            className={`px-3 py-1 border-3 border-black bg-[#f44336] text-white text-xs hover:bg-[#d32f2f] transition-all ${
              hoveredTool === "clear" ? "scale-125 shadow-xl ring-2 ring-yellow-400" : ""
            }`}
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            CLR ALL
          </button>
      </div>

      <div className="flex-1 relative bg-white border-2 border-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full cursor-crosshair"
          style={{ imageRendering: "auto" }}
        />
      </div>
    </div>
  );
}
