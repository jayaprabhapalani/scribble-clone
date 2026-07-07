import { useGameStore } from "../../store/useGameStore"
import { Badge } from "../ui/badge"
import { Timer, Eye, EyeOff } from "lucide-react"

export default function GameHeader() {
  const playerId = useGameStore((s) => s.playerId)
  const drawerId = useGameStore((s) => s.drawerId)
  const currentWord = useGameStore((s) => s.currentWord)
  const timeLeft = useGameStore((s) => s.timeLeft)
  const round = useGameStore((s) => s.round)
  const maxRounds = useGameStore((s) => s.maxRounds)
  const players = useGameStore((s) => s.players)

  const isDrawer = Number(playerId) === Number(drawerId)
  const drawerName = players.find((p) => p.id === drawerId)?.name ?? "..."

  // timer color — green > 10s, yellow > 5s, red <= 5s
  const timerColor =
    timeLeft > 10
      ? "text-green-500"
      : timeLeft > 5
      ? "text-yellow-500"
      : "text-destructive"

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">

      {/* left — round info */}
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          Round {round}/{maxRounds}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {isDrawer ? "You are drawing" : `${drawerName} is drawing`}
        </span>
      </div>

      {/* center — word display */}
      <div className="flex items-center gap-2">
        {isDrawer ? (
          <>
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold tracking-widest text-primary">
              {currentWord ?? "..."}
            </span>
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold tracking-widest text-muted-foreground">
              {currentWord
                ? currentWord.replace(/[a-zA-Z]/g, "_ ")
                : "_ _ _"}
            </span>
          </>
        )}
      </div>

      {/* right — timer */}
      <div className={`flex items-center gap-1 font-bold text-lg ${timerColor}`}>
        <Timer className="w-5 h-5" />
        {timeLeft}s
      </div>

    </div>
  )
}
