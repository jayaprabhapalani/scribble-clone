import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGameStore } from "../store/useGameStore"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Pencil } from "lucide-react"

const API = "http://localhost:8000"

export default function HomePage() {
  const navigate = useNavigate()
  const setIdentity = useGameStore((s) => s.setIdentity)

  // create room form
  const [createForm, setCreateForm] = useState({
    name: "",
    username: "",
    is_private: false,
    password: "",
    max_players: 5,
    max_rounds: 3,
  })

  // join room form
  const [joinForm, setJoinForm] = useState({
    room_id: "",
    username: "",
    password: "",
  })

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. create room
      const roomRes = await fetch(`${API}/rooms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          is_private: createForm.is_private,
          password: createForm.is_private ? createForm.password : undefined,
          max_players: createForm.max_players,
          max_rounds: createForm.max_rounds,
        }),
      })

      if (!roomRes.ok) {
        const err = await roomRes.json()
        throw new Error(err.detail ?? "Failed to create room")
      }

      const room = await roomRes.json()

      // 2. join the room as first player
      const joinRes = await fetch(`${API}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.id,
          user_name: createForm.username,
          password: createForm.is_private ? createForm.password : undefined,
        }),
      })

      if (!joinRes.ok) {
        const err = await joinRes.json()
        throw new Error(err.detail ?? "Failed to join room")
      }

      const player = await joinRes.json()

      setIdentity(player.player_id, createForm.username, player.room_id)
      navigate(`/lobby/${player.room_id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: parseInt(joinForm.room_id),
          user_name: joinForm.username,
          password: joinForm.password || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? "Failed to join room")
      }

      const player = await res.json()

      setIdentity(player.player_id, joinForm.username, player.room_id)
      navigate(`/lobby/${player.room_id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-3">
        <Pencil className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Scribble</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-lg">Get Started</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="join">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="join" className="flex-1">Join Room</TabsTrigger>
              <TabsTrigger value="create" className="flex-1">Create Room</TabsTrigger>
            </TabsList>

            {/* JOIN TAB */}
            <TabsContent value="join">
              <form onSubmit={handleJoin} className="flex flex-col gap-3">
                <Input
                  placeholder="Your name"
                  value={joinForm.username}
                  onChange={(e) => setJoinForm((f) => ({ ...f, username: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Room ID"
                  type="number"
                  value={joinForm.room_id}
                  onChange={(e) => setJoinForm((f) => ({ ...f, room_id: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Password (if private)"
                  type="password"
                  value={joinForm.password}
                  onChange={(e) => setJoinForm((f) => ({ ...f, password: e.target.value }))}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Joining..." : "Join Room"}
                </Button>
              </form>
            </TabsContent>

            {/* CREATE TAB */}
            <TabsContent value="create">
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <Input
                  placeholder="Your name"
                  value={createForm.username}
                  onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Room name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Max players (2-12)"
                    type="number"
                    min={2}
                    max={12}
                    value={createForm.max_players}
                    onChange={(e) => setCreateForm((f) => ({ ...f, max_players: parseInt(e.target.value) }))}
                  />
                  <Input
                    placeholder="Rounds (1-5)"
                    type="number"
                    min={1}
                    max={5}
                    value={createForm.max_rounds}
                    onChange={(e) => setCreateForm((f) => ({ ...f, max_rounds: parseInt(e.target.value) }))}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.is_private}
                    onChange={(e) => setCreateForm((f) => ({ ...f, is_private: e.target.checked }))}
                  />
                  Private room
                </label>
                {createForm.is_private && (
                  <Input
                    placeholder="Room password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Room"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <p className="text-destructive text-sm text-center mt-3">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
