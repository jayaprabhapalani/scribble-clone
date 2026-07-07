import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGameStore } from "../store/useGameStore"
import GameHeader from "../components/game/GameHeader"
import Canvas from "../components/game/Canvas"
import ChatBox from "../components/game/ChatBox"
import Scoreboard from "../components/game/Scoreboard"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Crown } from "lucide-react"

export default function GamePage({ sendMessage }) {
  const { roomId } = useParams()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const players = useGameStore((s) => s.players)
  const messages = useGameStore((s) => s.messages)
  const reset = useGameStore((s) => s.reset)

  // detect game_end from messages
  const gameEnded = messages.some((m) => m.type === "system" && m.text === "Game over!")

  // sort for final scoreboard
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const winner = sorted[0]

  function handleLeave() {
    reset()
    navigate("/")
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* top bar */}
      <GameHeader />

      {/* main area */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">

        {/* left — canvas */}
        <div className="flex flex-col flex-1 min-w-0">
          <Canvas sendMessage={sendMessage} />
        </div>

        {/* right — scoreboard + chat */}
        <div className="flex flex-col gap-3 w-64 shrink-0">
          <div className="h-48 shrink-0">
            <Scoreboard />
          </div>
          <div className="flex-1 min-h-0">
            <ChatBox sendMessage={sendMessage} />
          </div>
        </div>

      </div>

      {/* game end dialog */}
      <Dialog open={gameEnded}>
        <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Game Over!</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">

            {/* winner */}
            {winner && (
              <div className="flex flex-col items-center gap-1">
                <Crown className="w-8 h-8 text-yellow-500" />
                <p className="font-bold text-lg">{winner.name}</p>
                <p className="text-muted-foreground text-sm">{winner.score} points</p>
              </div>
            )}

            {/* final scores */}
            <div className="w-full flex flex-col gap-1">
              {sorted.map((p, idx) => (
                <div key={p.id} className="flex justify-between text-sm px-2 py-1 rounded-md bg-muted">
                  <span className="text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="flex-1 font-medium">
                    {p.name}
                    {p.id === playerId && <span className="text-muted-foreground ml-1">(you)</span>}
                  </span>
                  <span className="font-semibold">{p.score}</span>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleLeave}>
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
