// src/components/timetable/SlotModal.jsx
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Edit2 } from "lucide-react"
import { DAYS } from "@/stores/useTimetableStore"
import { Dropdown } from "./TimetableDropdown"
import { InfoBadge } from "./TimetableTooltip"
import { formatTime, CLASS_TYPES } from "@/utils/timetableHelpers"

export function SlotModal({ slot, day, periodId, subjects, periods, onSave, onClose }) {
  const isEdit = !!slot
  const [form, setForm] = useState({
    subjectId:    slot?.subjectId    || "",
    day:          slot?.day          || day        || "MON",
    periodId:     slot?.periodId     || periodId   || (periods[0]?.id || ""),
    span:         slot?.span         || 1,
    type:         slot?.type         || "lecture",
    room:         slot?.room         || "",
    teacher:      slot?.teacher      || "",
    note:         slot?.note         || "",
    isRecurring:  slot?.isRecurring  ?? true,
    specificDate: slot?.specificDate || "",
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const selectedSubject = subjects.find(s => s.id === form.subjectId)

  useEffect(() => {
    if (selectedSubject && !isEdit) {
      set("room",    selectedSubject.room    || "")
      set("teacher", selectedSubject.teacher || "")
    }
  }, [form.subjectId])

  const submit = () => {
    if (!form.subjectId) return
    onSave(form)
    onClose()
  }

  const nonBreakPeriods = periods.filter(p => !p.isBreak)
  const startIdx        = nonBreakPeriods.findIndex(p => p.id === form.periodId)
  const maxSpanFromHere = startIdx >= 0 ? nonBreakPeriods.length - startIdx : 1

  const dayOptions     = DAYS.map(d => ({ value: d, label: d }))
  const periodOptions  = nonBreakPeriods.map(p => ({ value: p.id, label: `${p.label}  (${formatTime(p.start)} – ${formatTime(p.end)})` }))
  const subjectOptions = subjects.map(s => ({ value: s.id, label: s.name, color: s.color }))
  const typeOptions    = CLASS_TYPES.map(t => ({ value: t.value, label: t.label, dot: t.color }))

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 sm:rounded-2xl rounded-t-2xl
                      border border-gray-200 dark:border-zinc-700 shadow-2xl
                      max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <h2 className="font-semibold text-base text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {isEdit ? <Edit2 size={13}/> : "+"}
            </span>
            {isEdit ? "Edit Slot" : "Add Class"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 flex items-center">
              Subject *<InfoBadge tip="Select from your subject list. Room and teacher auto-fill from subject defaults."/>
            </label>
            <Dropdown value={form.subjectId} onChange={v => set("subjectId", v)} options={subjectOptions} placeholder="Select subject…"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 block">Day</label>
              <Dropdown value={form.day} onChange={v => set("day", v)} options={dayOptions}/>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 flex items-center">
                Period<InfoBadge tip="The period this class starts at."/>
              </label>
              <Dropdown value={form.periodId} onChange={v => set("periodId", v)} options={periodOptions} placeholder="Select period…"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 flex items-center">
                Duration<InfoBadge tip="How many periods this spans. Labs typically span 2–4 periods."/>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={maxSpanFromHere} value={form.span}
                  onChange={e => set("span", Math.max(1, Math.min(maxSpanFromHere, Number(e.target.value))))}
                  className="w-20 h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                             bg-gray-50 dark:bg-zinc-800 text-foreground text-center
                             focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
                <span className="text-xs text-muted-foreground">period{form.span > 1 ? "s" : ""}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 block">Type</label>
              <Dropdown value={form.type} onChange={v => set("type", v)} options={typeOptions}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 flex items-center">
                Room<InfoBadge tip="Leave blank to use subject default room."/>
              </label>
              <input value={form.room} onChange={e => set("room", e.target.value)}
                placeholder={selectedSubject?.room || "e.g. CC09"}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-gray-50 dark:bg-zinc-800 text-foreground placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 flex items-center">
                Teacher<InfoBadge tip="Leave blank to use subject default teacher."/>
              </label>
              <input value={form.teacher} onChange={e => set("teacher", e.target.value)}
                placeholder={selectedSubject?.teacher || "Dr. Name"}
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-gray-50 dark:bg-zinc-800 text-foreground placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 flex items-center">
              Schedule Type<InfoBadge tip="Recurring = every week. One-off = a specific date only (e.g. makeup class)."/>
            </label>
            <div className="flex gap-2">
              {[
                { value: true,  label: "Recurring (weekly)" },
                { value: false, label: "One-off date"       },
              ].map(opt => (
                <button key={String(opt.value)} onClick={() => set("isRecurring", opt.value)}
                  className={`flex-1 h-9 text-xs font-medium rounded-lg border transition-colors
                    ${form.isRecurring === opt.value
                      ? "bg-violet-500 text-white border-violet-500"
                      : "bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-muted-foreground hover:border-gray-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {!form.isRecurring && (
              <input type="date" value={form.specificDate} onChange={e => set("specificDate", e.target.value)}
                className="mt-2 w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-gray-50 dark:bg-zinc-800 text-foreground
                           focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5 block">Note (optional)</label>
            <input value={form.note} onChange={e => set("note", e.target.value)}
              placeholder="e.g. Bring lab manual"
              className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                         bg-gray-50 dark:bg-zinc-800 text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
          <button onClick={onClose}
            className="flex-1 h-10 text-sm text-muted-foreground border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={!form.subjectId}
            className="flex-1 h-10 text-sm font-semibold bg-violet-500 hover:bg-violet-600
                       text-white rounded-xl disabled:opacity-40 transition-colors">
            {isEdit ? "Save Changes" : "Add Class"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}