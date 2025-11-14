export interface HandLandmarks {
  handedness: string;
  landmarks: Array<{ x: number; y: number; z: number }>;
}

export interface HandPointer {
  x: number;
  y: number;
  isPinching: boolean;
  hand: "left" | "right";
}

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
  isCorrectGuess?: boolean;
}

export interface ClientMessage {
  draw?: {
    type: "draw";
    stroke: DrawStroke;
  };
  chat?: {
    type: "chat";
    message: string;
  };
  selectWord?: {
    type: "select_word";
    word: string;
  };
  ready?: {
    type: "ready";
  };
  clearCanvas?: {
    type: "clear_canvas";
  };
}

export interface ServerMessage {
  playerJoined?: {
    type: "player_joined";
    player: Player;
  };
  playerLeft?: {
    type: "player_left";
    playerId: string;
  };
  playersUpdate?: {
    type: "players_update";
    players: Player[];
  };
  draw?: {
    type: "draw";
    stroke: DrawStroke;
  };
  chat?: {
    type: "chat";
    message: ChatMessage;
  };
  wordSelection?: {
    type: "word_selection";
    words: string[];
  };
  roundStart?: {
    type: "round_start";
    drawerId: string;
    wordHint: string;
    duration: number;
  };
  roundEnd?: {
    type: "round_end";
    word: string;
    scores: Record<string, number>;
  };
  gameEnd?: {
    type: "game_end";
    finalScores: Record<string, number>;
  };
  clearCanvas?: {
    type: "clear_canvas";
  };
  correctGuess?: {
    type: "correct_guess";
    playerId: string;
    username: string;
  };
}
