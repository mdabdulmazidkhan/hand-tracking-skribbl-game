import type { Player, DrawStroke } from "./types";

interface RoomData {
  code: string;
  players: Map<string, Player>;
  currentDrawerId: string | null;
  currentWord: string | null;
  wordOptions: string[];
  gameState: "waiting" | "word_selection" | "drawing" | "round_end" | "game_end";
  turnNumber: number;
  roundNumber: number;
  startTime: number | null;
  guessedPlayers: Set<string>;
  streams: Map<string, any>;
  drawingStrokes: DrawStroke[];
}

const rooms = new Map<string, RoomData>();

export function createRoom(code: string): RoomData {
  const room: RoomData = {
    code,
    players: new Map(),
    currentDrawerId: null,
    currentWord: null,
    wordOptions: [],
    gameState: "waiting",
    turnNumber: 0,
    roundNumber: 0,
    startTime: null,
    guessedPlayers: new Set(),
    streams: new Map(),
    drawingStrokes: [],
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomData | undefined {
  return rooms.get(code);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function addPlayer(roomCode: string, player: Player): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.players.set(player.id, player);
  }
}

export function removePlayer(roomCode: string, playerId: string): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.players.delete(playerId);
    room.streams.delete(playerId);
    if (room.players.size === 0) {
      deleteRoom(roomCode);
    }
  }
}

export function addStream(roomCode: string, playerId: string, stream: any): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.streams.set(playerId, stream);
  }
}

export function removeStream(roomCode: string, playerId: string): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.streams.delete(playerId);
  }
}
