import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import type { HandLandmarks } from "../types";

interface HandTrackerProps {
  onHandsDetected: (hands: HandLandmarks[]) => void;
}

export default function HandTracker({ onHandsDetected }: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hands: Hands | null = null;

    async function setupHandTracking() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        hands.onResults((results) => {
          if (results.multiHandLandmarks && results.multiHandedness) {
            const formattedHands: HandLandmarks[] =
              results.multiHandLandmarks.map((landmarks, index) => ({
                handedness: results.multiHandedness?.[index]?.label || "Unknown",
                landmarks: landmarks.map((lm) => ({
                  x: 1 - lm.x,
                  y: lm.y,
                  z: lm.z || 0,
                })),
              }));
            onHandsDetected(formattedHands);
          } else {
            onHandsDetected([]);
          }
        });

        detectHands();
      } catch (err) {
        console.error("Hand tracking setup error:", err);
      }
    }

    async function detectHands() {
      if (!videoRef.current || !hands) return;

      try {
        await hands.send({ image: videoRef.current });
      } catch (err) {
        console.error("Hand detection error:", err);
      }

      requestAnimationFrame(detectHands);
    }

    setupHandTracking();

    return () => {
      if (hands) {
        hands.close();
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [onHandsDetected]);

  return (
    <video
      ref={videoRef}
      className="hidden"
      width={640}
      height={480}
    />
  );
}
