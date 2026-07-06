import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./pages/HomePage"
import LobbyPage from "./pages/LobbyPage"
import GamePage from "./pages/GamePage"
import { useGameStore } from "./store/useGameStore"

function ProtectedRoute({ children }) {
  const { playerId, roomId } = useGameStore()
  if (!playerId || !roomId) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/lobby/:roomId"
            element={
              <ProtectedRoute>
                <LobbyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:roomId"
            element={
              <ProtectedRoute>
                <GamePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
