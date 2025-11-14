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
  const [showRoomCodeKeyboard, setShowRoomCodeKeyboard] = useState(false);
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");

  const pointers = useHandPointers(hands);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const joinButtonRef = useRef<HTMLButtonElement>(null);
  const usernameInputRef = useRef<HTMLDivElement>(null);
  const roomCodeInputRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const [lastPinchState, setLastPinchState] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    pointers.forEach((pointer, index) => {
      const handKey = `hand-${index}`;
      const wasPinching = lastPinchState[handKey];
      const isPinching = pointer.isPinching;

      if (!wasPinching && isPinching) {
        handleGestureClick(pointer.x, pointer.y);
      }

      setLastPinchState((prev) => ({ ...prev, [handKey]: isPinching }));
    });
  }, [pointers]);

  const handleGestureClick = (x: number, y: number) => {
    if (mode === "menu") {
      if (createButtonRef.current) {
        const rect = createButtonRef.current.getBoundingClientRect();
        if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
          handleCreateRoom();
        }
      }
      if (joinButtonRef.current) {
        const rect = joinButtonRef.current.getBoundingClientRect();
        if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
          setMode("join");
        }
      }
    }

    if (mode === "create" || mode === "join") {
      if (usernameInputRef.current && !showUsernameKeyboard && !showRoomCodeKeyboard) {
        const rect = usernameInputRef.current.getBoundingClientRect();
        if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
          setShowUsernameKeyboard(true);
        }
      }

      if (mode === "join" && roomCodeInputRef.current && !showUsernameKeyboard && !showRoomCodeKeyboard) {
        const rect = roomCodeInputRef.current.getBoundingClientRect();
        if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
          setShowRoomCodeKeyboard(true);
        }
      }

      if (confirmButtonRef.current && !showUsernameKeyboard && !showRoomCodeKeyboard) {
        const rect = confirmButtonRef.current.getBoundingClientRect();
        if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
          handleConfirm();
        }
      }

      if (backButtonRef.current && !showUsernameKeyboard && !showRoomCodeKeyboard) {
        const rect = backButtonRef.current.getBoundingClientRect();
        if (isPointerNear(x, y, rect.left + rect.width / 2, rect.top + rect.height / 2, 80)) {
          setMode("menu");
        }
      }
    }
  };

  const handleCreateRoom = async () => {
    setMode("create");
  };

  const handleConfirm = async () => {
    if (!username.trim()) {
      toast({ title: "Please enter a username", variant: "destructive" });
      return;
    }

    if (mode === "create") {
      try {
        const { roomCode } = await backend.game.create();
        onJoinRoom(roomCode, username);
      } catch (err) {
        console.error(err);
        toast({ title: "Failed to create room", variant: "destructive" });
      }
    } else if (mode === "join") {
      if (!roomCode.trim()) {
        toast({ title: "Please enter a room code", variant: "destructive" });
        return;
      }
      try {
        await backend.game.join({ roomCode: roomCode.toUpperCase() });
        onJoinRoom(roomCode.toUpperCase(), username);
      } catch (err) {
        console.error(err);
        toast({ title: "Room not found", variant: "destructive" });
      }
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      {pointers.map((pointer, index) => (
        <HandCursor key={index} pointer={pointer} />
      ))}

      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
            Draw & Guess
          </h1>
          <p className="text-2xl text-gray-700 font-semibold">
            Hand-Tracking Multiplayer Game
          </p>
        </div>

        {mode === "menu" && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 space-y-6">
            <button
              ref={createButtonRef}
              onClick={handleCreateRoom}
              className="w-full py-6 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-3xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              🎨 Create Team
            </button>

            <button
              ref={joinButtonRef}
              onClick={() => setMode("join")}
              className="w-full py-6 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white text-3xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              👥 Join Team
            </button>
          </div>
        )}

        {(mode === "create" || mode === "join") && !showUsernameKeyboard && !showRoomCodeKeyboard && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 space-y-6">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">Username</label>
              <div
                ref={usernameInputRef}
                className="bg-gray-100 rounded-xl p-4 text-xl font-semibold text-gray-800 border-4 border-blue-300 cursor-pointer hover:border-blue-500 transition-colors min-h-[60px]"
                onClick={() => setShowUsernameKeyboard(true)}
              >
                {username || <span className="text-gray-400">Tap to type...</span>}
              </div>
            </div>

            {mode === "join" && (
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Room Code</label>
                <div
                  ref={roomCodeInputRef}
                  className="bg-gray-100 rounded-xl p-4 text-xl font-semibold text-gray-800 border-4 border-purple-300 cursor-pointer hover:border-purple-500 transition-colors min-h-[60px] uppercase"
                  onClick={() => setShowRoomCodeKeyboard(true)}
                >
                  {roomCode || <span className="text-gray-400">Tap to type...</span>}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                ref={backButtonRef}
                onClick={() => setMode("menu")}
                className="flex-1 py-4 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                ← Back
              </button>
              <button
                ref={confirmButtonRef}
                onClick={handleConfirm}
                className="flex-1 py-4 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Confirm →
              </button>
            </div>
          </div>
        )}

        {showUsernameKeyboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-40">
            <div className="relative">
              <button
                onClick={() => setShowUsernameKeyboard(false)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-xl shadow-lg z-50"
              >
                ✕
              </button>
              <VirtualKeyboard
                hands={pointers}
                onInput={setUsername}
                initialValue={username}
              />
            </div>
          </div>
        )}

        {showRoomCodeKeyboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-40">
            <div className="relative">
              <button
                onClick={() => setShowRoomCodeKeyboard(false)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-xl shadow-lg z-50"
              >
                ✕
              </button>
              <VirtualKeyboard
                hands={pointers}
                onInput={(val) => setRoomCode(val.toUpperCase())}
                initialValue={roomCode}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
