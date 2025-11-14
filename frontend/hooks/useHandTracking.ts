import { useEffect, useState } from "react";
import type { HandLandmarks, HandPointer } from "../types";
import { detectPinch } from "../utils/gestures";

export function useHandPointers(hands: HandLandmarks[]): HandPointer[] {
  const [pointers, setPointers] = useState<HandPointer[]>([]);

  useEffect(() => {
    const newPointers: HandPointer[] = hands.map((hand) => {
      const indexTip = hand.landmarks[8];
      const isPinching = detectPinch(hand.landmarks);

      return {
        x: indexTip.x * window.innerWidth,
        y: indexTip.y * window.innerHeight,
        isPinching,
        hand: hand.handedness.toLowerCase() as "left" | "right",
      };
    });

    setPointers(newPointers);
  }, [hands]);

  return pointers;
}
