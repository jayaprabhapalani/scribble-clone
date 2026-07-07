import { useEffect, useRef, useState } from "react"
import { useGameStore } from "../../store/useGameStore"
import Toolbar from "./Toolbar"
import * as fabric from "fabric"

export default function Canvas({ sendMessage }) {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const isDrawing = useRef(false)

  const [isEraser, setIsEraser] = useState(false)

  const playerId = useGameStore((s) => s.playerId)
  const drawerId = useGameStore((s) => s.drawerId)
  const canvasEvents = useGameStore((s) => s.canvasEvents)
  const clearCanvas = useGameStore((s) => s.clearCanvas)

  const isDrawer = Number(playerId) === Number(drawerId)

  // init fabric canvas once on mount
  useEffect(() => {
    const fc = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: 800,
      height: 500,
      backgroundColor: "#ffffff",
    })

    fabricRef.current = fc

    return () => {
      fc.dispose()
    }
  }, [])

  // toggle drawing mode based on role
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc) return
    fc.isDrawingMode = isDrawer
    fc.selection = false
    if (isDrawer) {
      if (!fc.freeDrawingBrush) {
        fc.freeDrawingBrush = new fabric.PencilBrush(fc)
      }
      fc.freeDrawingBrush.color = "#000000"
      fc.freeDrawingBrush.width = 4
    }
  }, [isDrawer])

  // listen to drawer's path creation and publish to backend
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc || !isDrawer) return

    function onPathCreated(e) {
      const pathData = e.path.toObject()
      sendMessage({ event: "draw", data: pathData })
    }

    fc.on("path:created", onPathCreated)

    return () => {
      fc.off("path:created", onPathCreated)
    }
  }, [isDrawer, sendMessage])

  // replay incoming draw events from other players
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc || isDrawer) return

    const lastEvent = canvasEvents[canvasEvents.length - 1]
    if (!lastEvent) return

    fabric.Path.fromObject({ ...lastEvent, type: "path" }).then((path) => {
      path.selectable = false
      path.evented = false
      fc.add(path)
      fc.renderAll()
    })
  }, [canvasEvents, isDrawer])

  // clear canvas when store clears (round_start / round_end)
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc) return
    if (canvasEvents.length === 0) {
      fc.clear()
      fc.backgroundColor = "#ffffff"
      fc.renderAll()
    }
  }, [canvasEvents])

  function handleColorChange(color) {
    const fc = fabricRef.current
    if (!fc) return
    fc.freeDrawingBrush.color = color
    setIsEraser(false)
  }

  function handleBrushChange(size) {
    const fc = fabricRef.current
    if (!fc) return
    fc.freeDrawingBrush.width = size
  }

  function handleEraserToggle() {
    const fc = fabricRef.current
    if (!fc) return
    if (isEraser) {
      fc.freeDrawingBrush.color = "#000000"
      setIsEraser(false)
    } else {
      fc.freeDrawingBrush.color = "#ffffff"
      setIsEraser(true)
    }
  }

  function handleClear() {
    const fc = fabricRef.current
    if (!fc) return
    fc.clear()
    fc.backgroundColor = "#ffffff"
    fc.renderAll()
    clearCanvas()
    sendMessage({ event: "clear" })
  }

  return (
    <div className="flex flex-col">
      <div className="border rounded-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>

      {isDrawer && (
        <Toolbar
          onColorChange={handleColorChange}
          onBrushChange={handleBrushChange}
          onClear={handleClear}
          isEraser={isEraser}
          onEraserToggle={handleEraserToggle}
        />
      )}
    </div>
  )
}
