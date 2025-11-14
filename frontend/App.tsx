import { useState } from "react";
import "./styles.css";
import LandingPage from "./pages/LandingPage";
import GameLobby from "./pages/GameLobby";
import GameRoom from "./pages/GameRoom";
import HandTracker from "./components/HandTracker";
import HandOverlay from "./components/HandOverlay";
import type { HandLandmarks } from "./types";

export default function App() {
  const [page, setPage] = useState<"landing" | "lobby" | "game">("landing");
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [hands, setHands] = useState<HandLandmarks[]>([]);
  const [gameStream, setGameStream] = useState<any>(null);

  const handleJoinRoom = (code: string, user: string) => {
    setRoomCode(code);
    setUsername(user);
    setPage("lobby");
  };

  const handleStartGame = (stream: any) => {
    setGameStream(stream);
    setPage("game");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <HandTracker onHandsDetected={setHands} />
      <HandOverlay hands={hands} />

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

      {page === "game" && gameStream && (
        <GameRoom
          hands={hands}
          roomCode={roomCode}
          username={username}
          playerId={playerId}
          stream={gameStream}
        />
      )}
    </div>
  );
}
