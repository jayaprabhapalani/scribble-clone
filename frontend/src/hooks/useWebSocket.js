import { useEffect, useRef, useCallback } from "react"
import { useGameStore } from "../store/useGameStore"

const WS_BASE = "ws://localhost:8000/ws"

export function useWebSocket(roomId, playerId) {
  const ws = useRef(null)

  const {
    setRoomState,
    addPlayer,
    removePlayer,
    setDrawer,
    setCurrentWord,
    setTimeLeft,
    setRound,
    addCanvasEvent,
    clearCanvas,
    addMessage,
    updateScore,
    round,
  } = useGameStore()

  const handleMessage = useCallback(
    (event) => {
      const data = JSON.parse(event.data)

      switch (data.event ?? data.type) {
        case "init":
          setRoomState(data.data)
          break

        case "join":
          addPlayer(data.player_id)
          break

        case "leave":
          removePlayer(data.player_id)
          addMessage({ type: "system", text: `Player ${data.player_id} left` })
          break

        case "countdown":
          setTimeLeft(data.value)
          break

        case "round_start":
          clearCanvas()
          setDrawer(data.drawer_id)
          setCurrentWord(null)
          setRound(round + 1)
          addMessage({ type: "system", text: `Round started! Drawer: ${data.drawer_id}` })
          break

        case "your_word":
          setCurrentWord(data.word)
          break

        case "timer":
          setTimeLeft(data.value)
          break

        case "draw":
          addCanvasEvent(data.data)
          break

        case "guess":
          addMessage({ type: "guess", playerId: data.player_id, text: data.guess })
          break

        case "correct_guess":
          updateScore(data.player_id)
          addMessage({ type: "correct", playerId: data.player_id, text: "guessed correctly!" })
          break

        case "round_end":
          clearCanvas()
          setCurrentWord(null)
          addMessage({ type: "system", text: `Round ended! Word was: ${data.word}` })
          break

        case "game_end":
          addMessage({ type: "system", text: "Game over!" })
          break

        default:
          break
      }
    },
    [
      setRoomState, addPlayer, removePlayer, setDrawer,
      setCurrentWord, setTimeLeft, setRound, addCanvasEvent,
      clearCanvas, addMessage, updateScore, round,
    ]
  )

  useEffect(() => {
    if (!roomId || !playerId) return

    ws.current = new WebSocket(`${WS_BASE}/${roomId}/${playerId}`)

    ws.current.onmessage = handleMessage

    ws.current.onclose = () => {
      console.log("WebSocket disconnected")
    }

    ws.current.onerror = (e) => {
      console.error("WebSocket error", e)
    }

    return () => {
      ws.current?.close()
    }
  }, [roomId, playerId])

  // update handler ref when dependencies change
  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = handleMessage
    }
  }, [handleMessage])

  const sendMessage = useCallback((payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload))
    }
  }, [])

  return { sendMessage }
}
