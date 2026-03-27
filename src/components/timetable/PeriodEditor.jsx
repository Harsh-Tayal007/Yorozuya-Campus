// src/components/timetable/PeriodEditor.jsx
import { useState } from "react"
import { Plus, Trash2, Zap } from "lucide-react"

/**
 * Given a start time string "HH:MM" and duration in minutes,
 * returns an array of period objects auto-generated from that start.
 * Inserts a lunch break after the 4th period automatically.
 */
function generatePeriods(startTime, durationMins, count, breakDurationMins, uid) {
  const [sh, sm] = startTime.split(":").map(Number)
  let cursor = sh * 60 + sm   // minutes from midnight

  const toHHMM = (mins) => {
    const h = Math.floor(mins / 60) % 24
    const m = mins % 60
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`
  }

  const periods = []
  const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"]
  let pIdx = 0

  for (let i = 0; i < count; i++) {
    // Insert lunch break after 4th period
    if (i === 4) {
      periods.push({ id: uid(), label: "LUNCH", start: toHHMM(cursor), end: toHHMM(cursor + breakDurationMins), isBreak: true })
      cursor += breakDurationMins
    }
    const start = toHHMM(cursor)
    cursor += durationMins
    periods.push({ id: uid(), label: ROMAN[pIdx++] || `P${pIdx}`, start, end: toHHMM(cursor), isBreak: false })
  }
  return periods
}

export function PeriodEditor({ periods, onUpdate, onAdd, onRemove, onRegenerate }) {
  const [showGen, setShowGen]         = useState(false)
  const [startTime, setStartTime]     = useState("09:00")
  const [duration, setDuration]       = useState(55)
  const [count, setCount]             = useState(8)
  const [breakDur, setBreakDur]       = useState(50)

  const handleGenerate = () => {
    const newPeriods = generatePeriods(startTime, Number(duration), Number(count), Number(breakDur), crypto.randomUUID)
    onRegenerate(newPeriods)
    setShowGen(false)
  }

  return (
    <div className="space-y-2 overflow-x-auto">
      {/* Auto-generate strip */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold">Periods</span>
        <button onClick={() => setShowGen(v => !v)}
          className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-600 font-medium transition-colors">
          <Zap size={11}/> Auto-generate
        </button>
      </div>

      {showGen && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/20 p-3 space-y-3 mb-2">
          <p className="text-[11px] text-muted-foreground">Generate periods from a start time with equal durations.</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1 block">Start time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-white dark:bg-zinc-800 text-foreground
                           focus:outline-none focus:ring-1 focus:ring-violet-400"/>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1 block">Period length (min)</label>
              <input type="number" min={20} max={120} value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-white dark:bg-zinc-800 text-foreground text-center
                           focus:outline-none focus:ring-1 focus:ring-violet-400"/>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1 block">No. of periods</label>
              <input type="number" min={1} max={12} value={count} onChange={e => setCount(e.target.value)}
                className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-white dark:bg-zinc-800 text-foreground text-center
                           focus:outline-none focus:ring-1 focus:ring-violet-400"/>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1 block">Lunch break (min)</label>
              <input type="number" min={10} max={120} value={breakDur} onChange={e => setBreakDur(e.target.value)}
                className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-white dark:bg-zinc-800 text-foreground text-center
                           focus:outline-none focus:ring-1 focus:ring-violet-400"/>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60">Lunch break is inserted automatically after period IV.</p>
          <div className="flex gap-2">
            <button onClick={() => setShowGen(false)}
              className="flex-1 h-8 text-xs text-muted-foreground border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleGenerate}
              className="flex-1 h-8 text-xs font-semibold bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors">
              Generate & replace
            </button>
          </div>
        </div>
      )}

      {/* Desktop header */}
      <div className="hidden sm:grid gap-1 mb-2" style={{ gridTemplateColumns: "1fr 90px 90px 90px 32px", minWidth: 380 }}>
        {["Label", "Start", "End", "Break?", ""].map(h => (
          <div key={h} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{h}</div>
        ))}
      </div>

      {periods.map(p => (
        <div key={p.id}>
          {/* Desktop row */}
          <div className="hidden sm:grid items-center gap-1.5" style={{ gridTemplateColumns: "1fr 90px 90px 90px 32px", minWidth: 380 }}>
            <input value={p.label} onChange={e => onUpdate(p.id, { label: e.target.value })}
              placeholder="e.g. I"
              className="h-8 px-2.5 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                         bg-gray-50 dark:bg-zinc-800 text-foreground
                         focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
            <input type="time" value={p.start} onChange={e => onUpdate(p.id, { start: e.target.value })}
              className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700
                         bg-gray-50 dark:bg-zinc-800 text-foreground
                         focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
            <input type="time" value={p.end} onChange={e => onUpdate(p.id, { end: e.target.value })}
              className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-700
                         bg-gray-50 dark:bg-zinc-800 text-foreground
                         focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
            <button onClick={() => onUpdate(p.id, { isBreak: !p.isBreak })}
              className={`h-8 rounded-lg text-xs font-medium border transition-colors
                ${p.isBreak
                  ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                  : "bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-muted-foreground hover:border-gray-300"}`}>
              {p.isBreak ? "Break ✓" : "Break"}
            </button>
            <button onClick={() => onRemove(p.id)} disabled={periods.length <= 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg
                         text-muted-foreground hover:text-destructive hover:bg-destructive/10
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Trash2 size={13}/>
            </button>
          </div>

          {/* Mobile card */}
          <div className="sm:hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input value={p.label} onChange={e => onUpdate(p.id, { label: e.target.value })}
                placeholder="Label e.g. I"
                className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-600
                           bg-white dark:bg-zinc-700 text-foreground
                           focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
              <button onClick={() => onUpdate(p.id, { isBreak: !p.isBreak })}
                className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors shrink-0
                  ${p.isBreak
                    ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    : "bg-white dark:bg-zinc-700 border-gray-200 dark:border-zinc-600 text-muted-foreground"}`}>
                {p.isBreak ? "Break ✓" : "Break"}
              </button>
              <button onClick={() => onRemove(p.id)} disabled={periods.length <= 1}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground
                           hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors">
                <Trash2 size={14}/>
              </button>
            </div>
            <div className="flex gap-2">
              {[
                { key: "start", label: "Start" },
                { key: "end",   label: "End"   },
              ].map(({ key, label }) => (
                <div key={key} className="flex-1">
                  <div className="text-[10px] text-muted-foreground/70 mb-1 uppercase tracking-wide font-semibold">{label}</div>
                  <input type="time" value={p[key]} onChange={e => onUpdate(p.id, { [key]: e.target.value })}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-600
                               bg-white dark:bg-zinc-700 text-foreground
                               focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => onAdd({ label: `${periods.length + 1}`, start: "17:00", end: "18:00", isBreak: false })}
        className="w-full flex items-center justify-center gap-1.5 h-9 text-xs
                   text-muted-foreground border border-dashed border-border/60 rounded-lg
                   hover:border-violet-400 hover:text-violet-600 transition-colors">
        <Plus size={12}/> Add Period
      </button>
    </div>
  )
}