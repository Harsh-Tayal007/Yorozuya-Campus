import { useState, useEffect, useRef } from "react"
import { ChevronDown, Check } from "lucide-react"
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
          rounded-lg border text-sm transition-all duration-150 text-left
          ${disabled
            ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
            : "cursor-pointer border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
          }
          ${open ? "border-blue-500 ring-2 ring-blue-500/10" : ""}
          text-slate-900 dark:text-white`}
      >
        <span className={selected ? "" : "text-slate-400 dark:text-slate-600"}>
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
            rounded-xl border border-slate-200 dark:border-white/10
            bg-white dark:bg-[#0f1b2e]
            shadow-xl shadow-black/20
            overflow-hidden"
          style={{
            zIndex: 99999,
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
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
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

  const validate = (step) => {
    if (step === 1 && !data.universityId) { setError("Please select a university"); return false }
    if (step === 2 && !data.programId) { setError("Please select a program"); return false }
    if (step === 3 && !data.branchId) { setError("Please select a branch"); return false }
    setError(null)
    return true
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isTeacher ? "University details" : "Academic details"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Step 2 of 3 - {isTeacher ? "Select your university" : "Help us personalise your experience"}
        </p>
      </div>

      <Stepper
        initialStep={1}
        disableStepIndicators={true} // Force sequential flow
        onBeforeNext={validate}
        onStepChange={(step) => {
          // You could add logic here if needed
        }}
        onFinalStepCompleted={() => {
          onNext()
        }}
        backButtonProps={{
          className: "hidden" // We'll handle back to AccountStep via custom button if needed, or use Stepper's Back
        }}
        nextButtonText="Next"
      >
        <Step>
          <div className="space-y-3.5 py-2">
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
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2.5">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  As a teacher, you only need to select your university.
                </p>
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="pt-2">
               <Button variant="ghost" onClick={onBack} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 p-0 h-auto">
                 ← Back to account details
               </Button>
            </div>
          </div>
        </Step>

        {!isTeacher && (
          <Step>
            <div className="space-y-3.5 py-2">
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
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </Step>
        )}

        {!isTeacher && (
          <Step>
            <div className="space-y-3.5 py-2">
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
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </Step>
        )}
      </Stepper>
    </div>
  )
}

export default AcademicStep