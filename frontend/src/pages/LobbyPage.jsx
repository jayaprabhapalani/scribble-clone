import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useGameStore } from "../store/useGameStore"
import { useWebSocket } from "../hooks/useWebSocket"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Users, Clock, Lock, Globe } from "lucide-react"

export default function LobbyPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const { playerId, playerName, players, maxPlayers, timeLeft, messages, status } =
    useGameStore((s) => ({
      playerId: s.playerId,
      playerName: s.playerName,
      players: s.players,
      maxPlayers: s.maxPlayers,
      timeLeft: s.timeLeft,
      messages: s.messages,
      status: s.status,
    }))

  const { sendMessage } = useWebSocket(parseInt(roomId), playerId)

  // when backend sends round_start, game has begun — move to game page
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.type === "system" && lastMsg.text.startsWith("Round started")) {
      navigate(`/game/${roomId}`)
    }
  }, [messages])

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
