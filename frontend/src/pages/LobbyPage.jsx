import { useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useGameStore } from "../store/useGameStore"
import { useWebSocket } from "../hooks/useWebSocket"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Users, Clock, Lock, Globe } from "lucide-react"

export default function LobbyPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const playerName = useGameStore((s) => s.playerName)
  const players = useGameStore((s) => s.players)
  const maxPlayers = useGameStore((s) => s.maxPlayers)
  const timeLeft = useGameStore((s) => s.timeLeft)
  const status = useGameStore((s) => s.status)

  const { sendMessage } = useWebSocket(parseInt(roomId), playerId)

  const round = useGameStore((s) => s.round)

  const navigated = useRef(false)

  // navigate to game when first round starts
  useEffect(() => {
    if (navigated.current) return
    if (round > 0) {
      navigated.current = true
      navigate(`/game/${roomId}`)
    }
  }, [round])

  const isCountingDown = timeLeft > 0 && status === "waiting"
  const needsMorePlayers = players.length < 2

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">

      {/* header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Waiting Room</h1>
        <p className="text-muted-foreground text-sm mt-1">Room ID: {roomId}</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">

        {/* countdown or waiting banner */}
        <Card className={isCountingDown ? "border-primary" : ""}>
          <CardContent className="flex items-center justify-center gap-3 py-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            {needsMorePlayers ? (
              <p className="text-muted-foreground text-sm">
                Waiting for more players... ({players.length}/{maxPlayers})
              </p>
            ) : isCountingDown ? (
              <p className="text-primary font-semibold text-lg">
                Game starts in {timeLeft}s
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Enough players — game starting soon...
              </p>
            )}
          </CardContent>
        </Card>

        {/* player list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players ({players.length}/{maxPlayers})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {players.length === 0 ? (
              <p className="text-muted-foreground text-sm">No players yet</p>
            ) : (
              players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-muted"
                >
                  <span className="text-sm font-medium">
                    {p.name}
                    {p.id === playerId && (
                      <span className="text-muted-foreground ml-1">(you)</span>
                    )}
                  </span>
                  <Badge variant="secondary">{p.role}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* room info */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
          <Globe className="w-3 h-3" />
          <span>Share Room ID <strong className="text-foreground">{roomId}</strong> with friends to invite them</span>
        </div>

      </div>
    </div>
  )
}
