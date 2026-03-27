// src/components/ui/ColorPicker.jsx
import { SUBJECT_COLORS } from "@/stores/useTimetableStore"

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUBJECT_COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 active:scale-95
                      ${value === c ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-zinc-900 scale-110" : ""}`}
          style={{ background: c }}/>
      ))}
    </div>
  )
}