export interface Player {
  id: string;
  username: string;
  score: number;
  isReady: boolean;
}

export interface DrawStroke {
  playerId: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

export interface ChatMessage {
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
  isCorrectGuess: boolean | undefined;
}

export interface JoinMessage {
  type: "join";
  playerId: string;
  username: string;
}

export interface DrawMessage {
  type: "draw";
  stroke: DrawStroke;
}

export interface ChatMessageInput {
  type: "chat";
  message: string;
}

export interface SelectWordMessage {
  type: "select_word";
  word: string;
}

export interface ReadyMessage {
  type: "ready";
}

export interface ClearCanvasMessage {
  type: "clear_canvas";
}

export interface PlayerJoinedMessage {
  type: "player_joined";
  player: Player;
}

export interface PlayerLeftMessage {
  type: "player_left";
  playerId: string;
}

export interface PlayersUpdateMessage {
  type: "players_update";
  players: Player[];
}

export interface DrawMessageOut {
  type: "draw";
  stroke: DrawStroke;
}

export interface ChatMessageOut {
  type: "chat";
  message: ChatMessage;
}

export interface WordSelectionMessage {
  type: "word_selection";
  words: string[];
  drawerId: string;
}

export interface RoundStartMessage {
  type: "round_start";
  drawerId: string;
  wordHint: string;
  duration: number;
}

export interface RoundEndMessage {
  type: "round_end";
  word: string;
  scores: Record<string, number>;
}

export interface GameEndMessage {
  type: "game_end";
  finalScores: Record<string, number>;
}

export interface ClearCanvasMessageOut {
  type: "clear_canvas";
}

export interface CorrectGuessMessage {
  type: "correct_guess";
  playerId: string;
  username: string;
}

export type ClientMessage =
  | JoinMessage
  | DrawMessage
  | ChatMessageInput
  | SelectWordMessage
  | ReadyMessage
  | ClearCanvasMessage;

export type ServerMessage =
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayersUpdateMessage
  | DrawMessageOut
  | ChatMessageOut
  | WordSelectionMessage
  | RoundStartMessage
  | RoundEndMessage
  | GameEndMessage
  | ClearCanvasMessageOut
  | CorrectGuessMessage;
