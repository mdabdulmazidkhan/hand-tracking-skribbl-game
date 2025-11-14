import type { Player } from "../types";

interface PlayerListProps {
  players: Player[];
  currentDrawerId: string | null;
  playerId: string;
}

export default function PlayerList({ players, currentDrawerId, playerId }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="h-full bg-white border-3 border-black p-3 flex flex-col">
      <h2 className="text-xs mb-3 text-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        PLAYERS
      </h2>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`p-2 border-2 border-black ${
              player.id === playerId ? "bg-[#e3f2fd]" : "bg-white"
            } ${player.id === currentDrawerId ? "bg-yellow-200" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs truncate" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                {index === 0 ? "★ " : ""}{player.username}
              </span>
            </div>
            {player.id === currentDrawerId && (
              <div className="text-xs text-black mt-1" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                DRAWING
              </div>
            )}
            <div className="text-sm text-black mt-1" style={{ fontFamily: "'Press Start 2P', cursive" }}>
              {player.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
