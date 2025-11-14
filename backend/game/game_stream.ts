import { api, StreamInOut } from "encore.dev/api";
import type { Player, ChatMessage, DrawMessage, ChatMessageInput, SelectWordMessage, ReadyMessage, ClearCanvasMessage } from "./types";
import type { PlayerJoinedMessage, PlayerLeftMessage, PlayersUpdateMessage, DrawMessageOut, ChatMessageOut, WordSelectionMessage, RoundStartMessage, RoundEndMessage, GameEndMessage, ClearCanvasMessageOut, CorrectGuessMessage } from "./types";
import { getRoom, addPlayer, removePlayer, addStream, removeStream } from "./state";
import { getRandomWords } from "./words";
import log from "encore.dev/log";

interface GameHandshake {
  roomCode: string;
  playerId: string;
  username: string;
}

interface ClientMessage {
  draw?: DrawMessage;
  chat?: ChatMessageInput;
  selectWord?: SelectWordMessage;
  ready?: ReadyMessage;
  clearCanvas?: ClearCanvasMessage;
}

interface ServerMessage {
  playerJoined?: PlayerJoinedMessage;
  playerLeft?: PlayerLeftMessage;
  playersUpdate?: PlayersUpdateMessage;
  draw?: DrawMessageOut;
  chat?: ChatMessageOut;
  wordSelection?: WordSelectionMessage;
  roundStart?: RoundStartMessage;
  roundEnd?: RoundEndMessage;
  gameEnd?: GameEndMessage;
  clearCanvas?: ClearCanvasMessageOut;
  correctGuess?: CorrectGuessMessage;
}

const ROUND_DURATION = 180000; // 3 minutes
const WORD_SELECTION_DURATION = 15000; // 15 seconds to choose

export const stream = api.streamInOut<GameHandshake, ClientMessage, ServerMessage>(
  { expose: true, path: "/game/stream" },
  async (handshake, stream) => {
    const { roomCode, playerId, username } = handshake;
    const room = getRoom(roomCode.toUpperCase());

    if (!room) {
      await stream.close();
      return;
    }

    const player: Player = {
      id: playerId,
      username,
      score: 0,
      isReady: false,
    };

    addPlayer(roomCode.toUpperCase(), player);
    addStream(roomCode.toUpperCase(), playerId, stream);

    await broadcastToRoom(roomCode.toUpperCase(), {
      playerJoined: {
        type: "player_joined",
        player,
      },
    });

    await sendPlayersUpdate(roomCode.toUpperCase());

    try {
      for await (const message of stream) {
        await handleClientMessage(roomCode.toUpperCase(), playerId, message, stream);
      }
    } catch (err) {
      log.error("Stream error:", err);
    } finally {
      removePlayer(roomCode.toUpperCase(), playerId);
      removeStream(roomCode.toUpperCase(), playerId);

      await broadcastToRoom(roomCode.toUpperCase(), {
        playerLeft: {
          type: "player_left",
          playerId,
        },
      });

      await sendPlayersUpdate(roomCode.toUpperCase());
    }
  }
);

async function handleClientMessage(
  roomCode: string,
  playerId: string,
  message: ClientMessage,
  senderStream: StreamInOut<ClientMessage, ServerMessage>
): Promise<void> {
  const room = getRoom(roomCode);
  if (!room) return;

  if (message.draw) {
    if (room.currentDrawerId === playerId && room.gameState === "drawing") {
      room.drawingStrokes.push(message.draw.stroke);
      await broadcastToRoom(roomCode, {
        draw: {
          type: "draw",
          stroke: message.draw.stroke,
        },
      });
    }
  } else if (message.chat) {
    const player = room.players.get(playerId);
    if (!player) return;

    const isCorrectGuess =
      room.currentWord &&
      room.gameState === "drawing" &&
      room.currentDrawerId !== playerId &&
      !room.guessedPlayers.has(playerId) &&
      message.chat.message.toLowerCase().trim() === room.currentWord.toLowerCase();

    if (isCorrectGuess) {
      room.guessedPlayers.add(playerId);
      player.score += 10;

      await broadcastToRoom(roomCode, {
        correctGuess: {
          type: "correct_guess",
          playerId,
          username: player.username,
        },
      });

      await sendPlayersUpdate(roomCode);

      if (room.guessedPlayers.size === room.players.size - 1) {
        await endRound(roomCode);
      }
    } else {
      // Only send chat message if it's NOT a correct guess
      const chatMessage: ChatMessage = {
        playerId,
        username: player.username,
        message: message.chat.message,
        timestamp: Date.now(),
        isCorrectGuess: undefined,
      };

      await broadcastToRoom(roomCode, {
        chat: {
          type: "chat",
          message: chatMessage,
        },
      });
    }
  } else if (message.selectWord) {
    if (room.currentDrawerId === playerId && room.gameState === "word_selection") {
      room.currentWord = message.selectWord.word;
      room.gameState = "drawing";
      room.startTime = Date.now();
      room.guessedPlayers.clear();

      const wordHint = room.currentWord.replace(/./g, "_ ");

      await broadcastToRoom(roomCode, {
        roundStart: {
          type: "round_start",
          drawerId: playerId,
          wordHint,
          duration: ROUND_DURATION,
        },
      });

      setTimeout(() => {
        const currentRoom = getRoom(roomCode);
        if (currentRoom && currentRoom.gameState === "drawing") {
          endRound(roomCode);
        }
      }, ROUND_DURATION);
    }
  } else if (message.ready) {
    const p = room.players.get(playerId);
    if (p) {
      p.isReady = true;
      await sendPlayersUpdate(roomCode);

      const allReady = Array.from(room.players.values()).every((pl) => pl.isReady);
      if (allReady && room.players.size >= 2 && room.gameState === "waiting") {
        await startGame(roomCode);
      }
    }
  } else if (message.clearCanvas) {
    if (room.currentDrawerId === playerId && room.gameState === "drawing") {
      room.drawingStrokes = [];
      await broadcastToRoom(roomCode, {
        clearCanvas: { type: "clear_canvas" },
      });
    }
  }
}

async function startGame(roomCode: string): Promise<void> {
  const room = getRoom(roomCode);
  if (!room) return;

  room.gameState = "word_selection";
  room.turnNumber = 0;
  room.roundNumber = 1;
  room.drawingStrokes = [];

  const playerIds = Array.from(room.players.keys());
  room.currentDrawerId = playerIds[0];

  room.wordOptions = getRandomWords(3);

  await broadcastToRoom(roomCode, {
    wordSelection: {
      type: "word_selection",
      words: room.wordOptions,
    },
  });

  setTimeout(() => {
    const currentRoom = getRoom(roomCode);
    if (currentRoom && currentRoom.gameState === "word_selection") {
      const randomWord = currentRoom.wordOptions[0];
      handleClientMessage(
        roomCode,
        currentRoom.currentDrawerId!,
        {
          selectWord: {
            type: "select_word",
            word: randomWord,
          },
        },
        currentRoom.streams.get(currentRoom.currentDrawerId!)!
      );
    }
  }, WORD_SELECTION_DURATION);
}

async function endRound(roomCode: string): Promise<void> {
  const room = getRoom(roomCode);
  if (!room) return;

  const word = room.currentWord || "";
  const scores: Record<string, number> = {};
  room.players.forEach((player, id) => {
    scores[id] = player.score;
  });

  room.gameState = "round_end";

  await broadcastToRoom(roomCode, {
    roundEnd: {
      type: "round_end",
      word,
      scores,
    },
  });

  room.drawingStrokes = [];

  setTimeout(async () => {
    const currentRoom = getRoom(roomCode);
    if (!currentRoom) return;

    const playerIds = Array.from(currentRoom.players.keys());
    currentRoom.turnNumber++;

    if (currentRoom.turnNumber >= playerIds.length) {
      currentRoom.gameState = "game_end";
      const finalScores: Record<string, number> = {};
      currentRoom.players.forEach((player, id) => {
        finalScores[id] = player.score;
      });

      await broadcastToRoom(roomCode, {
        gameEnd: {
          type: "game_end",
          finalScores,
        },
      });
    } else {
      currentRoom.currentDrawerId = playerIds[currentRoom.turnNumber];
      currentRoom.gameState = "word_selection";
      currentRoom.wordOptions = getRandomWords(3);

      await broadcastToRoom(roomCode, {
        wordSelection: {
          type: "word_selection",
          words: currentRoom.wordOptions,
        },
      });

      setTimeout(() => {
        const r = getRoom(roomCode);
        if (r && r.gameState === "word_selection") {
          const randomWord = r.wordOptions[0];
          handleClientMessage(
            roomCode,
            r.currentDrawerId!,
            {
              selectWord: {
                type: "select_word",
                word: randomWord,
              },
            },
            r.streams.get(r.currentDrawerId!)!
          );
        }
      }, WORD_SELECTION_DURATION);
    }
  }, 5000);
}

async function broadcastToRoom(roomCode: string, message: ServerMessage): Promise<void> {
  const room = getRoom(roomCode);
  if (!room) return;

  for (const stream of room.streams.values()) {
    try {
      await stream.send(message);
    } catch (err) {
      log.error("Error sending to stream:", err);
    }
  }
}

async function sendPlayersUpdate(roomCode: string): Promise<void> {
  const room = getRoom(roomCode);
  if (!room) return;

  const players = Array.from(room.players.values());
  await broadcastToRoom(roomCode, {
    playersUpdate: {
      type: "players_update",
      players,
    },
  });
}
