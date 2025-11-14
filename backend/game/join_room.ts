import { api, APIError } from "encore.dev/api";
import { getRoom } from "./state";

interface JoinRoomRequest {
  roomCode: string;
}

interface JoinRoomResponse {
  success: boolean;
}

// Validates that a room exists before joining.
export const join = api<JoinRoomRequest, JoinRoomResponse>(
  { expose: true, method: "POST", path: "/game/join" },
  async ({ roomCode }) => {
    const room = getRoom(roomCode.toUpperCase());
    if (!room) {
      throw APIError.notFound("Room not found");
    }
    return { success: true };
  }
);
