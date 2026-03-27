// src/components/timetable/TodayWidget.jsx
import { Calendar } from "lucide-react"
import { formatTime, getNowPeriod, getTodayDay } from "@/utils/timetableHelpers"

export function TodayWidget({ periods, subjects, slots, activeDays }) {
  const today     = getTodayDay()
  const nowPeriod = getNowPeriod(periods)

  if (!activeDays.includes(today)) return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
      <p className="text-2xl mb-2">🎉</p>
      <p className="text-sm font-medium text-foreground">No classes today</p>
      <p className="text-xs text-muted-foreground mt-1">{today} is not an active day</p>
    </div>
  )

  const todaySlots = slots
    .filter(sl => sl.day === today && (sl.isRecurring || !sl.specificDate))
    .sort((a, b) => {
      const pa = periods.find(p => p.id === a.periodId)
      const pb = periods.find(p => p.id === b.periodId)
      return (pa?.start || "") < (pb?.start || "") ? -1 : 1
    })

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-violet-500"/>
          <p className="text-sm font-semibold text-foreground">Today — {today}</p>
        </div>
        <p className="text-xs text-muted-foreground">{todaySlots.length} class{todaySlots.length !== 1 ? "es" : ""}</p>
      </div>
      {todaySlots.length === 0 ? (
        <p className="text-xs text-muted-foreground p-6 text-center">No classes scheduled for today</p>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-zinc-800/60">
          {todaySlots.map(slot => {
            const subject   = subjects.find(s => s.id === slot.subjectId)
            const period    = periods.find(p => p.id === slot.periodId)
            const isCurrent = period?.id === nowPeriod?.id
            if (!subject || !period) return null
            return (
              <div key={slot.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isCurrent ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                <div className="w-1 h-10 rounded-full shrink-0" style={{ background: subject.color }}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{subject.name}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(period.start)} – {formatTime(period.end)}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {(slot.room || subject.room) && (
                    <p className="text-[10px] text-muted-foreground">{slot.room || subject.room}</p>
                  )}
                  {(slot.teacher || subject.teacher) && (
                    <p className="text-[10px] text-muted-foreground/60 truncate max-w-[80px]">{slot.teacher || subject.teacher}</p>
                  )}
                  {isCurrent && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded block">Now</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}