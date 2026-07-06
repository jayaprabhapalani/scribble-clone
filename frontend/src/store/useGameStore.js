import { create } from "zustand"

export const useGameStore = create((set, get) => ({
  // player identity
  playerId: null,
  playerName: null,
  roomId: null,

  // room
  players: [],
  maxPlayers: 0,
  status: "waiting",

  // round
  drawerId: null,
  currentWord: null,
  round: 0,
  maxRounds: 3,
  timeLeft: 0,

  // canvas
  canvasEvents: [],

  // chat
  messages: [],

  // setters
  setIdentity: (playerId, playerName, roomId) =>
    set({ playerId, playerName, roomId }),

  setRoomState: (state) =>
    set({
      players: state.players ?? [],
      maxPlayers: state.max_players ?? 0,
      status: state.status ?? "waiting",
      drawerId: state.drawer_id ?? null,
      currentWord: state.current_word ?? null,
      maxRounds: state.max_rounds ?? 3,
      canvasEvents: state.canvas_event ?? [],
    }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((s) => ({ players: [...s.players, player] })),

  removePlayer: (playerId) =>
    set((s) => ({ players: s.players.filter((p) => p.id !== playerId) })),

  setDrawer: (drawerId) => set({ drawerId }),

  setCurrentWord: (word) => set({ currentWord: word }),

  setTimeLeft: (t) => set({ timeLeft: t }),

  setRound: (round) => set({ round }),

  addCanvasEvent: (event) =>
    set((s) => ({ canvasEvents: [...s.canvasEvents, event] })),

  clearCanvas: () => set({ canvasEvents: [] }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  updateScore: (playerId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, is_guessed: true, score: p.score + 10 } : p
      ),
    })),

  reset: () =>
    set({
      playerId: null,
      playerName: null,
      roomId: null,
      players: [],
      maxPlayers: 0,
      status: "waiting",
      drawerId: null,
      currentWord: null,
      round: 0,
      maxRounds: 3,
      timeLeft: 0,
      canvasEvents: [],
      messages: [],
    }),
}))
