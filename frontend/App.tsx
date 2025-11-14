import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import GameLobby from "./pages/GameLobby";
import GameRoom from "./pages/GameRoom";
import HandTracker from "./components/HandTracker";
import type { HandLandmarks } from "./types";

export default function App() {
  const [page, setPage] = useState<"landing" | "lobby" | "game">("landing");
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [hands, setHands] = useState<HandLandmarks[]>([]);

  const handleJoinRoom = (code: string, user: string) => {
    setRoomCode(code);
    setUsername(user);
    setPage("lobby");
  };

  const handleStartGame = () => {
    setPage("game");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <HandTracker onHandsDetected={setHands} />

      {page === "landing" && (
        <LandingPage hands={hands} onJoinRoom={handleJoinRoom} />
      )}

      {page === "lobby" && (
        <GameLobby
          hands={hands}
          roomCode={roomCode}
          username={username}
          playerId={playerId}
          onStartGame={handleStartGame}
        />
      )}

      {page === "game" && (
        <GameRoom
          hands={hands}
          roomCode={roomCode}
          username={username}
          playerId={playerId}
        />
      )}
    </div>
  );
}
