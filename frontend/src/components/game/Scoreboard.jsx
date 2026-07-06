import { useGameStore } from "../../store/useGameStore"
import { Badge } from "../ui/badge"
import { Crown, Pencil, CheckCircle2, Circle } from "lucide-react"

export default function Scoreboard() {
  const { players, drawerId, playerId } = useGameStore((s) => ({
    players: s.players,
    drawerId: s.drawerId,
    playerId: s.playerId,
  }))

  // sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-card h-full">

      {/* header */}
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <Crown className="w-4 h-4 text-yellow-500" />
        <span className="font-semibold text-sm">Scoreboard</span>
      </div>

      {/* player rows */}
      <div className="flex-1 overflow-y-auto flex flex-col divide-y">
        {sorted.map((player, idx) => {
          const isCurrentPlayer = player.id === playerId
          const isDrawing = player.id === drawerId

          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-2 ${
                isCurrentPlayer ? "bg-muted" : ""
              }`}
            >
              {/* rank */}
              <span className="text-xs text-muted-foreground w-4 shrink-0">
                {idx + 1}
              </span>

              {/* status icon */}
              {isDrawing ? (
                <Pencil className="w-3 h-3 text-primary shrink-0" />
              ) : player.is_guessed ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
              )}

              {/* name */}
              <span className="flex-1 text-sm font-medium truncate">
                {player.name}
                {isCurrentPlayer && (
                  <span className="text-muted-foreground ml-1 font-normal">(you)</span>
                )}
              </span>

              {/* score */}
              <Badge variant={isCurrentPlayer ? "default" : "secondary"}>
                {player.score}
              </Badge>
            </div>
          )
        })}
      </div>

    </div>
  )
}
