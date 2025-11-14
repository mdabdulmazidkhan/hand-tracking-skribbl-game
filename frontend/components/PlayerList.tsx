import { Users, Crown } from "lucide-react";
import type { Player } from "../types";

interface PlayerListProps {
  players: Player[];
  currentDrawerId: string | null;
  playerId: string;
}

export default function PlayerList({ players, currentDrawerId, playerId }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="h-full bg-white rounded-2xl shadow-xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Players</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              player.id === playerId
                ? "bg-blue-50 border-blue-400"
                : "bg-gray-50 border-gray-200"
            } ${
              player.id === currentDrawerId
                ? "ring-4 ring-yellow-400"
                : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                <span className="font-bold text-gray-800 truncate">
                  {player.username}
                </span>
              </div>
              {player.id === currentDrawerId && (
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-bold">
                  DRAWING
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-blue-600">
              {player.score} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
