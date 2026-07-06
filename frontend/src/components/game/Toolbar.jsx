import { useState } from "react"
import { Eraser, Trash2 } from "lucide-react"
import { Button } from "../ui/button"

const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
  "#ec4899", "#6b7280", "#92400e", "#065f46",
]

const BRUSH_SIZES = [4, 8, 14, 20]

export default function Toolbar({ onColorChange, onBrushChange, onClear, isEraser, onEraserToggle }) {
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [selectedSize, setSelectedSize] = useState(4)

  function handleColor(color) {
    setSelectedColor(color)
    onColorChange(color)
  }

  function handleSize(size) {
    setSelectedSize(size)
    onBrushChange(size)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-t bg-card">

      {/* color palette */}
      <div className="flex flex-wrap gap-1">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handleColor(color)}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: selectedColor === color ? "#6366f1" : "#e5e7eb",
              transform: selectedColor === color ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* divider */}
      <div className="w-px h-6 bg-border" />

      {/* brush sizes */}
      <div className="flex items-center gap-2">
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => handleSize(size)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
            style={{
              border: selectedSize === size ? "2px solid #6366f1" : "2px solid transparent",
            }}
          >
            <div
              className="rounded-full bg-foreground"
              style={{ width: size, height: size }}
            />
          </button>
        ))}
      </div>

      {/* divider */}
      <div className="w-px h-6 bg-border" />

      {/* eraser + clear */}
      <div className="flex items-center gap-2">
        <Button
          variant={isEraser ? "default" : "outline"}
          size="sm"
          onClick={onEraserToggle}
        >
          <Eraser className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

    </div>
  )
}
