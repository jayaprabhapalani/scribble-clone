import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./pages/HomePage"
import LobbyPage from "./pages/LobbyPage"
import GamePage from "./pages/GamePage"
import { useGameStore } from "./store/useGameStore"
import { useWebSocket } from "./hooks/useWebSocket"

function ProtectedRoute({ children }) {
  const { playerId, roomId } = useGameStore()
  if (!playerId || !roomId) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const playerId = useGameStore((s) => s.playerId)
  const roomId = useGameStore((s) => s.roomId)

  const { sendMessage } = useWebSocket(
    roomId ? parseInt(roomId) : null,
    playerId
  )

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/lobby/:roomId"
        element={
          <ProtectedRoute>
            <LobbyPage sendMessage={sendMessage} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:roomId"
        element={
          <ProtectedRoute>
            <GamePage sendMessage={sendMessage} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}

export default App
