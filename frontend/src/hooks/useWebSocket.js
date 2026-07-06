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
  } = useGameStore()

  const handleMessage = useCallback(
    (event) => {
      const data = JSON.parse(event.data)

      switch (data.event ?? data.type) {
        case "init":
          setRoomState(data.data)
          break

        case "join":
          // backend only sends player_id on join, full player list comes via init
          // re-fetch is handled by setRoomState on next init, just add a system message
          addMessage({ type: "system", text: `Player ${data.player_id} joined` })
          break

        case "leave":
          removePlayer(data.player_id)
          addMessage({ type: "system", text: `Player ${data.player_id} left` })
          break

        case "countdown":
          setTimeLeft(data.value)
          break

        case "round_start": {
          const { playerId: pid } = useGameStore.getState()
          clearCanvas()
          setDrawer(data.drawer_id)
          if (pid !== data.drawer_id) setCurrentWord(null)
          setRound(useGameStore.getState().round + 1)
          addMessage({ type: "system", text: `Round started! Drawer: ${data.drawer_id}` })
          break
        }

        case "your_word":
        case "drawer_hint":
          setCurrentWord(data.word ?? data.data)
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
      clearCanvas, addMessage, updateScore,
    ]
  )

  useEffect(() => {
    if (!roomId || !playerId) return

    let socket
    const timer = setTimeout(() => {
      socket = new WebSocket(`${WS_BASE}/${roomId}/${playerId}`)
      ws.current = socket

      socket.onmessage = handleMessage
      socket.onclose = () => console.log("WebSocket disconnected")
      socket.onerror = (e) => console.error("WebSocket error", e)
    }, 50)

    return () => {
      clearTimeout(timer)
      socket?.close()
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
