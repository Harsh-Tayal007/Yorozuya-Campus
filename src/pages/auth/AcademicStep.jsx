import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"
import Stepper, { Step } from "@/components/ui/Stepper"

// ─────────────────────────────────────────────
// Custom Select - no Radix, no body scroll lock
// Renders its dropdown in-flow (no portal) so it
// never triggers body overflow changes. Shows 4
// items at a time, scrollable, scrollbar hidden.
// ─────────────────────────────────────────────
function NativeSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  const ITEM_H = 36   // px per item
  const VISIBLE = 4   // items visible at once

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full h-10 px-3.5 flex items-center justify-between gap-2
          rounded-xl border text-sm transition-all duration-150 text-left
          ${disabled
            ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
            : "cursor-pointer border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
          }
          ${open ? "border-blue-500 ring-2 ring-blue-500/20" : ""}
          text-slate-900 dark:text-slate-100`}
      >
        <span className={selected ? "" : "text-slate-400 dark:text-slate-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200
            ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown - in-flow, absolutely positioned relative to trigger */}
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)]
            rounded-xl border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800
            shadow-xl shadow-black/10 dark:shadow-black/30
            overflow-hidden"
          style={{
            zIndex: 100000,
            maxHeight: `${ITEM_H * VISIBLE}px`,
            overflowY: options.length > VISIBLE ? "scroll" : "hidden",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            .nsel-list::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="nsel-list">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                style={{ height: ITEM_H }}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full px-3.5 flex items-center gap-2 text-sm text-left
                  transition-colors duration-100
                  ${opt.value === value
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
              >
                {opt.value === value && <Check size={12} className="flex-shrink-0 text-blue-500" />}
                <span className={opt.value === value ? "ml-0" : "ml-[20px]"}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2 - Academic
// ─────────────────────────────────────────────
const AcademicStep = ({ data, setData, onNext, onBack, accountType }) => {
  const isTeacher = accountType === "teacher"
  const [universities, setUniversities] = useState([])
  const [programs, setPrograms] = useState([])
  const [branches, setBranches] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => { getUniversities().then(res => setUniversities(res || [])).catch(() => {}) }, [])
  useEffect(() => {
    if (isTeacher || !data.universityId) { setPrograms([]); return }
    getProgramsByUniversity(data.universityId).then(res => setPrograms(res || [])).catch(() => {})
  }, [data.universityId]) // eslint-disable-line
  useEffect(() => {
    if (isTeacher || !data.programId) { setBranches([]); return }
    getBranchesByProgram(data.programId).then(res => setBranches(res || [])).catch(() => {})
  }, [data.programId]) // eslint-disable-line

  const validate = () => {
    if (!data.universityId) { setError("Please select a university"); return false }
    if (!isTeacher && !data.programId) { setError("Please select a program"); return false }
    if (!isTeacher && !data.branchId) { setError("Please select a branch"); return false }
    setError(null)
    return true
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {isTeacher ? "University details" : "Academic details"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Step 2 of 3 - {isTeacher ? "Select your university" : "Help us personalise your experience"}
        </p>
      </div>

      <div className="space-y-4 py-2">
        {/* University Selection */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">University</Label>
          <NativeSelect
            value={data.universityId || ""}
            onChange={val => {
              setData(prev => ({ ...prev, universityId: val, programId: "", branchId: "" }))
              setError(null)
            }}
            options={universities.map(u => ({ value: u.$id, label: u.name }))}
            placeholder="Select university"
          />
        </div>

        {isTeacher && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-3 py-2.5">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              As a teacher, you only need to select your university.
            </p>
          </div>
        )}

        {!isTeacher && (
          <>
            {/* Program Selection */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Program</Label>
              <NativeSelect
                value={data.programId || ""}
                onChange={val => {
                  setData(prev => ({ ...prev, programId: val, branchId: "" }))
                  setError(null)
                }}
                options={programs.map(p => ({ value: p.$id, label: p.name }))}
                placeholder="Select program"
                disabled={!data.universityId}
              />
            </div>

            {/* Branch Selection */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Branch</Label>
              <NativeSelect
                value={data.branchId || ""}
                onChange={val => {
                  setData(prev => ({ ...prev, branchId: val }))
                  setError(null)
                }}
                options={branches.map(b => ({ value: b.$id, label: b.name }))}
                placeholder="Select branch"
                disabled={!data.programId}
              />
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>}

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { if (validate()) onNext() }}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold
              shadow-lg shadow-blue-600/20 transition-all duration-150 flex items-center justify-center gap-2"
          >
            Continue <ChevronRight size={14} />
          </button>
          
          <button type="button" onClick={onBack} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-0 h-auto cursor-pointer transition">
            ← Back to account details
          </button>
        </div>
      </div>
    </div>
  )
}

export default AcademicStep