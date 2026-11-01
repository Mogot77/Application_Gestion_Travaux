import { useState } from 'react'
import { COLORS } from './constants'
import type { ColorPickerProps } from './types'

const ColorPicker = ({ initial }: ColorPickerProps) => {
  const [color, setColor] = useState(initial)
  return (
    <div className="row !gap-2">
      {COLORS.map(c => (
        <label key={c} className="cursor-pointer">
          <input type="radio" name="color" value={c} checked={c === color} onChange={() => setColor(c)} className="absolute opacity-0" />
          <span className="av !size-7" style={{ background: c, outline: c === color ? '3px solid var(--color-ink)' : 'none', outlineOffset: 2 }}></span>
        </label>
      ))}
    </div>
  )
}

export default ColorPicker
