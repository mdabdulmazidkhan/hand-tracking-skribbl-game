import { api } from "encore.dev/api";
import { createRoom } from "./state";

interface CreateRoomResponse {
  roomCode: string;
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Creates a new game room and returns the room code.
export const create = api<void, CreateRoomResponse>(
  { expose: true, method: "POST", path: "/game/create" },
  async () => {
    const roomCode = generateRoomCode();
    createRoom(roomCode);
    return { roomCode };
  }
);
