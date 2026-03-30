
import { useState, useEffect } from "react"
import {
  Save, Download, Image as ImageIcon, Sparkles,
  Calendar, Clock, Edit2, BookOpen,
  RotateCcw, Copy, Loader2, Check, AlertCircle,
} from "lucide-react"
import { useTimetableStore, DAYS, DEFAULT_PERIODS } from "@/stores/useTimetableStore"
import { useTimetableActions } from "@/hooks/useTimetableActions"
import { uid } from "@/utils/timetableHelpers"

import { Tooltip } from "@/components/timetable/TimetableTooltip"
import { ClickDropdown } from "@/components/timetable/TimetableDropdown"

import { TimetableGrid } from "@/components/timetable/TimetableGrid"
import { TodayWidget } from "@/components/timetable/TodayWidget"
import { SlotModal } from "@/components/timetable/SlotModal"
import { AIScanModal } from "@/components/timetable/AIScanModal"
import { OnboardingPanel } from "@/components/timetable/OnboardingPanel"
import { PeriodEditor } from "@/components/timetable/PeriodEditor"
import { SubjectEditor } from "@/components/timetable/SubjectEditor"
import { SavedPanel } from "@/components/timetable/SavedPanel"
import { InfoBadge } from "@/components/timetable/TimetableTooltip"
import { useAIScanQuota } from "@/hooks/useAIScanQuota"

const LS_SEEN = "unizuya_timetable_seen"

const TABS = [
  { key: "grid", label: "Grid", icon: Calendar },
  { key: "today", label: "Today", icon: Clock },
  { key: "setup", label: "Setup", icon: Edit2 },
  { key: "saved", label: "Saved", icon: BookOpen },
]

export default function TimetableBuilder() {
  const store = useTimetableStore()
  const {
    name, periods, subjects, slots, activeDays, saving, savedTimetables, loading, userId,
    setName, addPeriod, updatePeriod, removePeriod, setPeriods,
    addSubject, updateSubject, removeSubject,
    addSlot, updateSlot, removeSlot,
    setActiveDays, deleteSaved, loadFromDoc, init,
  } = store

  const { quota: ttQuota, increment: incrementTT } = useAIScanQuota(userId, "timetable")
  const ttScansLeft = ttQuota ? ttQuota.limit - ttQuota.used : null
  const ttBlocked = ttQuota && !ttQuota.allowed

  const actions = useTimetableActions()

  const [tab, setTab] = useState("grid")
  const [slotModal, setSlotModal] = useState(null)
  const [aiModal, setAiModal] = useState(false)
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem(LS_SEEN))

  useEffect(() => { init() }, [])

  const dismissOnboard = () => {
    setShowOnboard(false)
    localStorage.setItem(LS_SEEN, "1")
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <Loader2 className="w-7 h-7 animate-spin text-violet-500 mx-auto" />
        <p className="text-sm text-muted-foreground">Loading timetable…</p>
      </div>
    </div>
  )

  return (
    <div className="w-full text-gray-900 dark:text-zinc-100">
      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {slotModal && (
        <SlotModal
          slot={slotModal.slot} day={slotModal.day} periodId={slotModal.periodId}
          subjects={subjects} periods={periods}
          onSave={form => slotModal.slot ? updateSlot(slotModal.slot.id, form) : addSlot(form)}
          onClose={() => setSlotModal(null)}
        />
      )}
      {aiModal && (
        <AIScanModal
          periods={periods} subjects={subjects}
          onClose={() => setAiModal(false)}
          onApply={actions.handleAIApply}
          onIncrement={incrementTT}
          quota={ttQuota}
          userId={userId}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-violet-500" />
            </div>
            <div className="min-w-0">
              <input value={name} onChange={e => setName(e.target.value)}
                className="text-xl font-bold bg-transparent border-none outline-none text-foreground w-full truncate"
                placeholder="Timetable name…" />
              <p className="text-xs text-muted-foreground">{subjects.length} subjects · {slots.length} slots</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip text="Show feature guide">
              <button onClick={() => setShowOnboard(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700
                           text-gray-400 dark:text-zinc-500 hover:text-violet-500 hover:border-violet-300 transition-colors text-sm font-bold">
                ?
              </button>
            </Tooltip>

            <button
              type="button"
              onClick={() => !ttBlocked && setAiModal(true)}
              disabled={ttBlocked}
              title={ttBlocked ? `Daily limit reached (${ttQuota?.limit}/day). Resets at midnight UTC.` : undefined}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors select-none border
    ${ttBlocked
                  ? "border-border text-muted-foreground/40 bg-muted/20 cursor-not-allowed opacity-60"
                  : "border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40"}`}>
              <Sparkles size={13} /> AI Scan
              {ttScansLeft !== null && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold
      ${ttBlocked ? "bg-red-500/10 text-red-400" : "bg-violet-500/15 text-violet-600 dark:text-violet-300"}`}>
                  {ttScansLeft}
                </span>
              )}
            </button>

            <ClickDropdown label="Export" icon={Download} variant="default">
              {({ close }) => (
                <div className="py-1">
                  <button
                    onClick={async () => { close(); await actions.handleExportPDF() }}
                    disabled={actions.exporting}
                    className="w-full px-3 py-2.5 text-xs text-left text-foreground hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors flex items-center gap-2">
                    <Download size={12} /> Export as PDF
                    {actions.exporting && <Loader2 size={10} className="animate-spin ml-auto" />}
                  </button>
                  <button
                    onClick={() => { close(); actions.handleExportImage() }}
                    disabled={actions.imgExporting}
                    className="w-full px-3 py-2.5 text-xs text-left text-foreground hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors flex items-center gap-2">
                    <ImageIcon size={12} /> Export as PNG
                    {actions.imgExporting && <Loader2 size={10} className="animate-spin ml-auto" />}
                  </button>
                </div>
              )}
            </ClickDropdown>

            <button onClick={actions.handleSave} disabled={saving || !userId}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors
                ${actions.saved
                  ? "border border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "bg-violet-500 hover:bg-violet-600 text-white"}
                ${(saving || !userId) ? "opacity-50 cursor-not-allowed" : ""}`}>
              {actions.saved ? <><Check size={13} /> Saved!</>
                : saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                  : <><Save size={13} /> Save</>}
            </button>
          </div>
        </div>

        {/* ── Onboarding ──────────────────────────────────────────────── */}
        {showOnboard && <OnboardingPanel onDismiss={dismissOnboard} />}

        {actions.saveError && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertCircle size={13} className="text-destructive shrink-0" />
            <p className="text-xs text-destructive">{actions.saveError}</p>
          </div>
        )}

        {/* ── Active days ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 shrink-0">Active days:</span>
          {DAYS.map(d => (
            <button key={d}
              onClick={() => setActiveDays(activeDays.includes(d) ? activeDays.filter(x => x !== d) : [...activeDays, d])}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                ${activeDays.includes(d)
                  ? "bg-violet-500 text-white border-violet-500"
                  : "border-gray-200 dark:border-zinc-700 text-muted-foreground hover:border-gray-300"}`}>
              {d}
            </button>
          ))}
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-1 mb-6">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all
                  ${tab === t.key
                    ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"}`}>
                <Icon size={13} /> <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Grid tab ────────────────────────────────────────────────── */}
        {tab === "grid" && (
          subjects.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
              <Calendar size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No subjects yet</p>
              <p className="text-xs text-muted-foreground mb-4">Go to Setup tab to add subjects, or use AI Scan to auto-fill everything</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button onClick={() => setTab("setup")}
                  className="px-4 py-2 text-sm font-medium bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors">
                  Go to Setup
                </button>
                <button
                  type="button"
                  onClick={() => !ttBlocked && setAiModal(true)}
                  disabled={ttBlocked}
                  title={ttBlocked ? `Daily limit reached (${ttQuota?.limit}/day). Resets at midnight UTC.` : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors select-none
    border
    ${ttBlocked
                      ? "border-border text-muted-foreground/40 bg-muted/20 cursor-not-allowed opacity-60"
                      : "border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40"}`}>
                  <Sparkles size={13} /> AI Scan
                  {ttScansLeft !== null && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold
      ${ttBlocked ? "bg-red-500/10 text-red-400" : "bg-violet-500/15 text-violet-600 dark:text-violet-300"}`}>
                      {ttScansLeft}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div id="timetable-grid-export">
              <TimetableGrid
                periods={periods} subjects={subjects} slots={slots} activeDays={activeDays}
                onCellClick={(day, periodId) => setSlotModal({ day, periodId })}
                onSlotClick={slot => setSlotModal({ slot })}
                onSlotDelete={removeSlot}
              />
            </div>
          )
        )}

        {/* ── Today tab ───────────────────────────────────────────────── */}
        {tab === "today" && (
          <TodayWidget periods={periods} subjects={subjects} slots={slots} activeDays={activeDays} />
        )}

        {/* ── Setup tab ───────────────────────────────────────────────── */}
        {tab === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Periods / Time Slots
                    <InfoBadge tip="Define your institution's time periods. Label them I, II, III or any name. Mark lunch/break rows so they show as BREAK on the grid." />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Define time slots for your timetable</p>
                </div>
                <button onClick={() => setPeriods(DEFAULT_PERIODS.map(p => ({ ...p, id: uid() })))}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <RotateCcw size={11} /> Reset
                </button>
              </div>
              <PeriodEditor periods={periods} onUpdate={updatePeriod} onAdd={addPeriod} onRemove={removePeriod} onRegenerate={setPeriods} />
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Subjects
                    <InfoBadge tip="Add subjects with default teacher and room. These auto-fill on the grid but can be overridden per slot." />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => !ttBlocked && setAiModal(true)}
                  disabled={ttBlocked}
                  title={ttBlocked ? `Daily limit reached (${ttQuota?.limit}/day). Resets at midnight UTC.` : undefined}
                  className={`flex items-center gap-1 text-xs hover:underline transition-colors
    ${ttBlocked
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-violet-600 dark:text-violet-400"}`}>
                  <Sparkles size={11} />
                  Scan from image
                  {ttScansLeft !== null && (
                    <span className={`ml-1 px-1 rounded text-[10px] font-bold
      ${ttBlocked ? "text-red-400" : "text-violet-400"}`}>
                      ({ttScansLeft})
                    </span>
                  )}
                </button>
              </div>
              <SubjectEditor subjects={subjects} onAdd={addSubject} onUpdate={updateSubject} onRemove={removeSubject} />
            </div>
          </div>
        )}

        {/* ── Saved tab ───────────────────────────────────────────────── */}
        {tab === "saved" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground">{savedTimetables.length} saved</p>
              {actions.showSaveNew ? (
                <div className="flex items-center gap-2">
                  <input value={actions.saveNewName} onChange={e => actions.setSaveNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && actions.handleSaveNew()} autoFocus
                    placeholder="Timetable name…"
                    className="h-8 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                               bg-gray-50 dark:bg-zinc-800 text-foreground
                               focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
                  <button onClick={actions.handleSaveNew} disabled={!actions.saveNewName.trim()}
                    className="h-8 px-3 text-xs font-semibold bg-violet-500 text-white rounded-lg disabled:opacity-40 transition-colors">
                    Save
                  </button>
                  <button onClick={() => actions.setShowSaveNew(false)} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
              ) : (
                <button onClick={() => actions.setShowSaveNew(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                             border border-gray-200 dark:border-zinc-700 text-muted-foreground
                             hover:text-foreground hover:border-gray-300 transition-colors">
                  <Copy size={11} /> Save as new
                </button>
              )}
            </div>
            <SavedPanel
              saved={savedTimetables}
              onLoad={doc => { loadFromDoc(doc); setTab("grid") }}
              onDelete={deleteSaved}
            />
          </div>
        )}
      </div>
    </div>
  )
}