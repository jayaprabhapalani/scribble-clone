import { useState, useEffect, useRef } from "react"
import { useGameStore } from "../../store/useGameStore"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Send, CheckCircle2 } from "lucide-react"

export default function ChatBox({ sendMessage }) {
  const [guess, setGuess] = useState("")
  const bottomRef = useRef(null)

  const playerId = useGameStore((s) => s.playerId)
  const drawerId = useGameStore((s) => s.drawerId)
  const messages = useGameStore((s) => s.messages)
  const players = useGameStore((s) => s.players)

  const isDrawer = playerId === drawerId

  const currentPlayer = players.find((p) => p.id === playerId)
  const alreadyGuessed = currentPlayer?.is_guessed ?? false

  // auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSend(e) {
    e.preventDefault()
    const trimmed = guess.trim()
    if (!trimmed) return
    sendMessage({ event: "guess", data: trimmed })
    setGuess("")
  }

  function getMessageStyle(msg) {
    if (msg.type === "correct") return "text-green-500 font-semibold"
    if (msg.type === "system") return "text-muted-foreground italic text-xs"
    return "text-foreground"
  }

  function getPlayerName(id) {
    return players.find((p) => p.id === id)?.name ?? `Player ${id}`
  }

  function renderMessage(msg, idx) {
    if (msg.type === "system") {
      return (
        <div key={idx} className="text-center py-1">
          <span className={getMessageStyle(msg)}>{msg.text}</span>
        </div>
      )
    }

    if (msg.type === "correct") {
      return (
        <div key={idx} className="flex items-center gap-1 py-0.5">
          <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
          <span className="text-green-500 font-semibold text-sm">
            {getPlayerName(msg.playerId)} guessed correctly!
          </span>
        </div>
      )
    }

    // regular guess
    return (
      <div key={idx} className="flex gap-1 py-0.5 text-sm">
        <span className="font-medium shrink-0">{getPlayerName(msg.playerId)}:</span>
        <span className="text-muted-foreground break-all">{msg.text}</span>
      </div>
    )
  }

  const inputDisabled = isDrawer || alreadyGuessed

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">

      {/* message list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5 min-h-0">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center mt-4">
            No messages yet
          </p>
        ) : (
          messages.map((msg, idx) => renderMessage(msg, idx))
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-2 border-t"
      >
        <Input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={
            isDrawer
              ? "You are drawing..."
              : alreadyGuessed
              ? "You already guessed!"
              : "Type your guess..."
          }
          disabled={inputDisabled}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={inputDisabled}>
          <Send className="w-4 h-4" />
        </Button>
      </form>

    </div>
  )
}
