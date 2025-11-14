export function detectPinch(landmarks: Array<{ x: number; y: number; z: number }>): boolean {
  const thumb = landmarks[4];
  const index = landmarks[8];

  const distance = Math.sqrt(
    Math.pow(thumb.x - index.x, 2) +
    Math.pow(thumb.y - index.y, 2)
  );

  // Very tight pinch - fingers must be very close together
  return distance < 0.043;
}

export function isPointerNear(
  pointerX: number,
  pointerY: number,
  targetX: number,
  targetY: number,
  threshold: number = 50
): boolean {
  const distance = Math.sqrt(
    Math.pow(pointerX - targetX, 2) +
    Math.pow(pointerY - targetY, 2)
  );

  return distance < threshold;
}
