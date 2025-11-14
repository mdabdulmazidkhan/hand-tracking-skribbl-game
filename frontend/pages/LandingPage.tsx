import { useState, useRef, useEffect } from "react";
import { useHandPointers } from "../hooks/useHandTracking";
import { isPointerNear } from "../utils/gestures";
import VirtualKeyboard from "../components/VirtualKeyboard";
import HandCursor from "../components/HandCursor";
import backend from "~backend/client";
import { useToast } from "@/components/ui/use-toast";
import type { HandLandmarks } from "../types";

interface LandingPageProps {
  hands: HandLandmarks[];
  onJoinRoom: (roomCode: string, username: string) => void;
}

export default function LandingPage({ hands, onJoinRoom }: LandingPageProps) {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [showUsernameKeyboard, setShowUsernameKeyboard] = useState(false);
  const [showRoomKeyboard, setShowRoomKeyboard] = useState(false);

  const pointers = useHandPointers(hands);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);
  const usernameInputRef = useRef<HTMLDivElement>(null);
  const roomInputRef = useRef<HTMLDivElement>(null);

  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    pointers.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      if (!wasPinching && isPinching) {
        if (createButtonRef.current && username) {
          const rect = createButtonRef.current.getBoundingClientRect();
          if (isPointerNear(pointer.x, pointer.y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
            handleCreate();
          }
        }

        if (joinButtonRef.current && username && roomCode) {
          const rect = joinButtonRef.current.getBoundingClientRect();
          if (isPointerNear(pointer.x, pointer.y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
            handleJoin();
          }
        }

        if (usernameInputRef.current) {
          const rect = usernameInputRef.current.getBoundingClientRect();
          if (isPointerNear(pointer.x, pointer.y, rect.left + rect.width / 2, rect.top + rect.height / 2, 100)) {
            setShowUsernameKeyboard(true);
            setShowRoomKeyboard(false);
          }
        }

        if (roomInputRef.current) {
          const rect = roomInputRef.current.getBoundingClientRect();
          if (isPointerNear(pointer.x, pointer.y, rect.left + rect.width / 2, rect.top + rect.height / 2, 100)) {
            setShowRoomKeyboard(true);
            setShowUsernameKeyboard(false);
          }
        }
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });
  }, [pointers, username, roomCode]);

  const handleCreate = async () => {
    try {
      const room = await backend.game.create();
      onJoinRoom(room.roomCode, username);
    } catch (err) {
      console.error("Create room error:", err);
      toast({ title: "Failed to create room", variant: "destructive" });
    }
  };

  const handleJoin = async () => {
    try {
      await backend.game.join({ roomCode: roomCode.toUpperCase() });
      onJoinRoom(roomCode.toUpperCase(), username);
    } catch (err) {
      console.error("Join room error:", err);
      toast({ title: "Failed to join room", variant: "destructive" });
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-[#f0f0f0]">
      {pointers.map((pointer, index) => (
        <HandCursor key={index} pointer={pointer} />
      ))}

      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            SKRIBBL
          </h1>
          <p className="text-xs text-gray-600" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            with hand tracking
          </p>
        </div>

        <div className="bg-white border-4 border-black p-6 space-y-4">
          <div>
            <label className="block text-xs mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              NAME
            </label>
            <div
              ref={usernameInputRef}
              className="w-full p-3 border-3 border-black bg-white text-sm cursor-pointer"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
              onClick={() => {
                setShowUsernameKeyboard(true);
                setShowRoomKeyboard(false);
              }}
            >
              {username || "Click to type..."}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-2 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              ROOM CODE
            </label>
            <div
              ref={roomInputRef}
              className="w-full p-3 border-3 border-black bg-white text-sm cursor-pointer"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
              onClick={() => {
                setShowRoomKeyboard(true);
                setShowUsernameKeyboard(false);
              }}
            >
              {roomCode || "Click to type..."}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              ref={createButtonRef}
              onClick={handleCreate}
              disabled={!username}
              className="flex-1 py-3 border-4 border-black bg-[#4CAF50] text-white text-xs disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#45a049] active:translate-x-0.5 active:translate-y-0.5"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              CREATE
            </button>
            <button
              ref={joinButtonRef}
              onClick={handleJoin}
              disabled={!username || !roomCode}
              className="flex-1 py-3 border-4 border-black bg-[#2196F3] text-white text-xs disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#1976D2] active:translate-x-0.5 active:translate-y-0.5"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              JOIN
            </button>
          </div>
        </div>

        {(showUsernameKeyboard || showRoomKeyboard) && (
          <VirtualKeyboard
            hands={pointers}
            onInput={showUsernameKeyboard ? setUsername : setRoomCode}
            initialValue={showUsernameKeyboard ? username : roomCode}
          />
        )}
      </div>
    </div>
  );
}
