// src/components/timetable/TimetableGrid.jsx
import { Plus, X } from "lucide-react"
import { DAYS } from "@/stores/useTimetableStore"
import { hexToRgba, formatTime, getNowPeriod, getTodayDay } from "@/utils/timetableHelpers"

/**
 * Returns an abbreviated display name for grid cells.
 * Full name is shown on hover via the title attribute.
 * "Computer Organization and Architecture" → "COA"
 * "Operating Systems" → "OS"
 * "DAA Lab" → "DAA Lab"  (≤12 chars, kept as-is)
 */
const SKIP_WORDS = new Set(["and", "of", "the", "in", "for", "to", "a", "an"])
function abbrev(name) {
  if (!name || name.length <= 12) return name
  const initials = name
    .split(/\s+/)
    .filter(w => !SKIP_WORDS.has(w.toLowerCase()))
    .map(w => w[0].toUpperCase())
    .join("")
  return initials || name.slice(0, 6)
}

export function TimetableGrid({ periods, subjects, slots, activeDays, onCellClick, onSlotClick, onSlotDelete, readonly = false }) {
  const today      = getTodayDay()
  const nowPeriod  = getNowPeriod(periods)
  const visibleDays = DAYS.filter(d => activeDays.includes(d))

  // Build lookup maps
  const slotMap  = {}
  const occupied = {}
  slots.forEach(slot => {
    const key = `${slot.day}__${slot.periodId}`
    if (!slotMap[key]) slotMap[key] = slot
    if (slot.span > 1) {
      const nbp      = periods.filter(p => !p.isBreak)
      const startIdx = nbp.findIndex(p => p.id === slot.periodId)
      for (let s = 1; s < slot.span; s++) {
        const np = nbp[startIdx + s]
        if (np) occupied[`${slot.day}__${np.id}`] = true
      }
    }
  })

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-200 dark:border-zinc-800"
         style={{ WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth: `${80 + visibleDays.length * 130}px` }}>
        <table className="w-full border-collapse bg-white dark:bg-zinc-900">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-800/60">
              <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 w-20
                             border-b border-gray-200 dark:border-zinc-700 sticky left-0 bg-gray-50 dark:bg-zinc-800/60 z-10">
                Period
              </th>
              {visibleDays.map(day => (
                <th key={day}
                  className={`px-2 py-3 text-center text-xs font-bold border-b border-gray-200 dark:border-zinc-700 transition-colors
                    ${day === today ? "text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10" : "text-muted-foreground"}`}>
                  {day}
                  {day === today && (
                    <span className="ml-1 text-[9px] bg-violet-500 text-white px-1 py-0.5 rounded">Today</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period.id}
                className={`border-b border-gray-100 dark:border-zinc-800/60
                  ${period.isBreak         ? "bg-amber-50/40 dark:bg-amber-900/5"  : ""}
                  ${period.id === nowPeriod?.id ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}>

                {/* Sticky period label */}
                <td className="px-2 py-2 border-r border-gray-100 dark:border-zinc-800 text-center sticky left-0 bg-white dark:bg-zinc-900 z-10"
                    style={{ minWidth: 72 }}>
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-bold ${period.isBreak ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                      {period.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                      {formatTime(period.start)}
                    </span>
                    {period.id === nowPeriod?.id && (
                      <span className="text-[9px] bg-blue-500 text-white px-1 py-0.5 rounded mt-0.5">Now</span>
                    )}
                  </div>
                </td>

                {visibleDays.map(day => {
                  const key  = `${day}__${period.id}`
                  if (occupied[key]) return null

                  const slot    = slotMap[key]
                  const subject = slot ? subjects.find(s => s.id === slot.subjectId) : null

                  if (period.isBreak) {
                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">BREAK</span>
                      </td>
                    )
                  }

                  if (slot && subject) {
                    return (
                      <td key={day} className="px-1.5 py-1.5 align-top" rowSpan={slot.span > 1 ? slot.span : undefined}>
                        <div
                          className="group relative rounded-lg p-2 cursor-pointer transition-all hover:brightness-95 active:scale-[0.98]"
                          style={{
                            background: hexToRgba(subject.color, 0.12),
                            border:     `1px solid ${hexToRgba(subject.color, 0.3)}`,
                          }}
                          onClick={() => !readonly && onSlotClick?.(slot)}>
                          <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-lg" style={{ background: subject.color }}/>
                          <p className="text-[11px] font-bold pl-1.5 leading-tight truncate"
                             style={{ color: subject.color }}
                             title={subject.name}>
                            {abbrev(subject.name)}
                          </p>
                          {(slot.room || subject.room) && (
                            <p className="text-[10px] text-muted-foreground pl-1.5 truncate">{slot.room || subject.room}</p>
                          )}
                          {(slot.teacher || subject.teacher) && (
                            <p className="text-[10px] text-muted-foreground/70 pl-1.5 truncate">{slot.teacher || subject.teacher}</p>
                          )}
                          {slot.type !== "lecture" && (
                            <span className="text-[9px] px-1 py-0.5 rounded ml-1.5 font-medium"
                              style={{ background: hexToRgba(subject.color, 0.2), color: subject.color }}>
                              {slot.type}
                            </span>
                          )}
                          {!readonly && (
                            <button
                              onClick={e => { e.stopPropagation(); onSlotDelete?.(slot.id) }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100
                                         w-5 h-5 rounded flex items-center justify-center
                                         bg-white/80 dark:bg-zinc-900/80 text-gray-400 hover:text-red-500 transition-all">
                              <X size={10}/>
                            </button>
                          )}
                        </div>
                      </td>
                    )
                  }

                  return (
                    <td key={day} className="px-1.5 py-1.5" style={{ minWidth: 110 }}>
                      {!readonly && (
                        <button
                          onClick={() => onCellClick?.(day, period.id)}
                          className="w-full h-full min-h-[52px] rounded-lg border-2 border-dashed border-gray-200 dark:border-zinc-700
                                     text-gray-300 dark:text-zinc-700 hover:border-violet-300 dark:hover:border-violet-700
                                     hover:text-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/10
                                     flex items-center justify-center transition-colors active:scale-95">
                          <Plus size={14}/>
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}