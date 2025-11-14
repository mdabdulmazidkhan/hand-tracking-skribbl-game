import { useRef, useEffect, useState } from "react";
import type { HandPointer, DrawStroke } from "../types";
import { Eraser, Trash2 } from "lucide-react";
import { isPointerNear } from "../utils/gestures";

interface DrawingCanvasProps {
  hands: HandPointer[];
  strokes: DrawStroke[];
  isDrawing: boolean;
  onDrawStroke: (stroke: DrawStroke) => void;
  onClear: () => void;
  playerId: string;
}

const colors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];
const sizes = [2, 5, 10, 15];

export default function DrawingCanvas({
  hands,
  strokes,
  isDrawing,
  onDrawStroke,
  onClear,
  playerId,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentSize, setCurrentSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);
  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});

  const colorButtonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const sizeButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const eraserButtonRef = useRef<HTMLButtonElement>(null);
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
            color: isEraser ? "#FFFFFF" : currentColor,
            width: isEraser ? 20 : currentSize,
          });
        }
        setIsCurrentlyDrawing(false);
        setCurrentStroke([]);
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });
  }, [hands, isDrawing, currentColor, currentSize, isEraser, isCurrentlyDrawing, currentStroke]);

  const handleToolClick = (x: number, y: number) => {
    colorButtonsRef.current.forEach((button, color) => {
      if (!button) return;
      const rect = button.getBoundingClientRect();
      if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 30)) {
        setCurrentColor(color);
        setIsEraser(false);
      }
    });

    sizeButtonsRef.current.forEach((button, size) => {
      if (!button) return;
      const rect = button.getBoundingClientRect();
      if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 30)) {
        setCurrentSize(size);
      }
    });

    if (eraserButtonRef.current) {
      const rect = eraserButtonRef.current.getBoundingClientRect();
      if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 40)) {
        setIsEraser(true);
      }
    }

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
      ctx.strokeStyle = isEraser ? "#FFFFFF" : currentColor;
      ctx.lineWidth = isEraser ? 20 : currentSize;
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
    <div className="flex-1 bg-white rounded-2xl shadow-xl p-4 flex flex-col">
      {isDrawing && (
        <div className="flex gap-4 mb-4 items-center">
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                ref={(el) => {
                  if (el) colorButtonsRef.current.set(color, el);
                }}
                onClick={() => {
                  setCurrentColor(color);
                  setIsEraser(false);
                }}
                className={`w-10 h-10 rounded-full border-4 ${
                  currentColor === color && !isEraser
                    ? "border-blue-500 scale-110"
                    : "border-gray-300"
                } transition-all hover:scale-110`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-px h-10 bg-gray-300" />

          <div className="flex gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                ref={(el) => {
                  if (el) sizeButtonsRef.current.set(size, el);
                }}
                onClick={() => setCurrentSize(size)}
                className={`w-10 h-10 rounded-full border-4 flex items-center justify-center ${
                  currentSize === size && !isEraser
                    ? "border-blue-500 bg-blue-100"
                    : "border-gray-300 bg-white"
                } transition-all hover:scale-110`}
              >
                <div
                  className="rounded-full bg-black"
                  style={{ width: size * 2, height: size * 2 }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-10 bg-gray-300" />

          <button
            ref={eraserButtonRef}
            onClick={() => setIsEraser(true)}
            className={`p-2 rounded-lg ${
              isEraser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            } hover:scale-110 transition-all`}
          >
            <Eraser className="w-6 h-6" />
          </button>

          <button
            ref={clearButtonRef}
            onClick={onClear}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 hover:scale-110 transition-all"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="flex-1 relative bg-gray-50 rounded-xl overflow-hidden border-4 border-gray-200">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
