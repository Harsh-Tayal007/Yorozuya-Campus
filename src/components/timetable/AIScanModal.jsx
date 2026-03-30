// src/components/timetable/AIScanModal.jsx
import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Sparkles, Image as ImageIcon, AlertCircle, Loader2, Check } from "lucide-react"
import { fileToBase64 } from "@/utils/timetableHelpers"

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

function buildPrompt(mode) {
  if (mode === "subjects") {
    return `Extract ONLY the subject list from this timetable. Return ONLY a valid JSON array, no markdown, no code fences.

[
  { "name": "Operating Systems", "teacher": "Dr Rewa", "room": "IT-02" }
]

Include subject name, teacher name if visible, and room code if visible.`
  }

  return `This is a university class timetable. Extract the COMPLETE timetable and return ONLY valid JSON, no markdown, no explanation, no code fences.

Return this EXACT structure:
{
  "name": "timetable name if visible, else My Timetable",
  "activeDays": ["MON","TUE","WED","THU","FRI"],
  "periods": [
    { "label": "I",     "start": "09:00", "end": "09:55", "isBreak": false },
    { "label": "LUNCH", "start": "12:40", "end": "13:30", "isBreak": true  }
  ],
  "subjects": [
    { "name": "Operating Systems", "teacher": "Dr Rewa", "room": "IT-02", "color": "#6366f1" }
  ],
  "slots": [
    { "subjectName": "Operating Systems", "day": "MON", "periodLabel": "I", "span": 1, "type": "lecture" }
  ]
}

RULES:
- Days: MON TUE WED THU FRI SAT only. Times: 24h HH:MM.
- type: "lecture", "lab", or "tutorial". Any cell labeled "Lab" → type "lab".
- isBreak: true ONLY for LUNCH/BREAK/RECESS rows. NEVER create a slot for a break period.
- periodLabel = the label of the FIRST (topmost) period row the cell occupies.
- Extract EVERY visible slot.

SPAN DETECTION — THIS IS THE MOST IMPORTANT RULE:
Span = how many NON-BREAK period rows a single merged/tall cell physically occupies.

For EVERY cell you see, do this step-by-step:
  1. Look at the cell visually. Count every row it spans top-to-bottom (including break rows if the cell crosses them).
  2. Subtract the number of BREAK/LUNCH rows inside that span.
  3. That result is the span value.

Example A — 4-period lab, no break inside:
  Row I   → COA cell starts (top edge here)
  Row II  → COA (same cell continues)
  Row III → COA (same cell continues)
  Row IV  → COA (bottom edge here)
  → Spans 4 rows, 0 breaks inside → span: 4, periodLabel: "I"

Example B — lab that crosses a lunch row:
  Row I   → OS Lab starts
  Row II  → OS Lab
  Row LUNCH → OS Lab (cell visually crosses the break row)
  Row III → OS Lab ends
  → Spans 4 rows, 1 break inside → span: 3, periodLabel: "I"

Example C — single lecture:
  Row II  → DAA (cell only occupies this one row)
  → span: 1, periodLabel: "II"

DO NOT guess span from the subject name or label. Count the actual rows the cell occupies.
When uncertain between two counts, prefer the higher number.

- colors: cycle through #6366f1 #8b5cf6 #ec4899 #ef4444 #f97316 #f59e0b #10b981 #06b6d4 #3b82f6 #84cc16 #a855f7 #14b8a6`
}

// ── Props ─────────────────────────────────────────────────────────────────────
// onClose    : () => void
// onApply    : (result, mode) => void
// onIncrement: () => Promise<boolean>  — returns false if quota exceeded
// quota      : { used, limit, allowed } | null
// userId     : string | null
export function AIScanModal({ onClose, onApply, onIncrement, quota, userId }) {
  const [mode, setMode]     = useState("full")
  const [file, setFile]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState("idle")   // idle | scanning | review | error
  const [result, setResult] = useState(null)
  const [error, setError]   = useState("")
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null)
  }

  const handleModeChange = (m) => {
    if (m === mode) return
    setMode(m)
    setFile(null)
    setPreview(null)
    setStatus("idle")
    setResult(null)
    setError("")
  }

  const scan = async () => {
    if (!file) return

    // ── Quota gate — increment BEFORE calling Gemini ──────────────────────
    // This prevents abuse: failed/retried scans still count against the limit.
    if (onIncrement) {
      const allowed = await onIncrement()
      if (allowed === false) {
        setError(
          `Daily limit reached (${quota?.limit ?? 0} scan${quota?.limit === 1 ? "" : "s"}/day). Resets at midnight UTC.`
        )
        setStatus("error")
        return
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    setStatus("scanning")
    setError("")

    try {
      const base64    = await fileToBase64(file)
      const mediaType = file.type.startsWith("image/") ? file.type : "application/pdf"

      const body = {
        contents: [{
          parts: [
            { inline_data: { mime_type: mediaType, data: base64 } },
            { text: buildPrompt(mode) },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 16000,
        },
      }

      const res = await fetch(GEMINI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Gemini error ${res.status}`)

      const data = await res.json()

      // ── Track tokens for admin dashboard stats ────────────────────────────
      const tokens = data.usageMetadata?.totalTokenCount || 0
      navigator.sendBeacon(
        "https://unizuya-stats.harshtayal710.workers.dev/track/gemini",
        JSON.stringify({ tool: "timetable", tokens, userId: userId ?? null })
      )
      // ─────────────────────────────────────────────────────────────────────

      const text  = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() ?? ""
      const clean = text.replace(/```json|```/g, "").trim()
      if (!clean) throw new Error("Gemini returned an empty response. Try again.")

      let parsed
      try { parsed = JSON.parse(clean) }
      catch {
        const lookscut = !clean.endsWith("}") && !clean.endsWith("]")
        throw new Error(
          lookscut
            ? "The response was cut off mid-way — the timetable is too dense. Try 'Subjects only' mode first, or crop the image to fewer rows/columns and scan again."
            : "Could not parse the AI response. Try a clearer or more tightly cropped image."
        )
      }

      setResult(parsed)
      setStatus("review")
    } catch (e) {
      setError(e.message || "Scan failed")
      setStatus("error")
    }
  }

  const apply = () => {
    if (!result) return
    onApply(result, mode)
    onClose()
  }

  const reset = () => {
    setStatus("idle")
    setResult(null)
    setFile(null)
    setPreview(null)
    setError("")
  }

  // Remaining scans badge (null while quota is still loading)
  const scansLeft = quota ? quota.limit - quota.used : null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-2xl flex flex-col max-h-[88vh]">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Sparkles size={14} className="text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Scan Timetable</p>
              <p className="text-[11px] text-muted-foreground">Upload photo or PDF of your timetable</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Remaining scans badge */}
            {scansLeft !== null && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                ${quota?.allowed === false
                  ? "bg-red-500/10 text-red-400"
                  : "bg-violet-500/10 text-violet-500"}`}>
                {scansLeft} scan{scansLeft === 1 ? "" : "s"} left today
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Mode selector */}
          <div className="flex gap-2">
            {[
              { value: "full",     title: "Full scan",      desc: "Extracts periods, subjects, and places all classes" },
              { value: "subjects", title: "Subjects only",  desc: "Extracts subject list — you place them manually" },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
                onClick={() => handleModeChange(opt.value)}
                className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer
                  ${mode === opt.value
                    ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-400/30"
                    : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
                <p className="text-xs font-semibold text-foreground">{opt.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Upload area */}
          {status !== "review" && (
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl
                          border-2 border-dashed cursor-pointer transition-colors
                          ${file
                            ? "border-violet-400/60 bg-violet-50/50 dark:bg-violet-950/20"
                            : "border-gray-200 dark:border-zinc-700 hover:border-violet-300 hover:bg-muted/30"}`}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />
              {preview
                ? <img src={preview} alt="preview" className="max-h-28 rounded-lg object-contain border border-gray-200" />
                : (
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon size={18} className="text-muted-foreground" />
                  </div>
                )
              }
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {file ? file.name : "Click to upload timetable"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PNG, JPG or PDF · Crop tightly for better results
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Review */}
          {status === "review" && result && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  Scan complete ✓
                </p>
                {mode === "full" ? (
                  <div className="text-xs text-emerald-600 dark:text-emerald-500 space-y-0.5">
                    <p>{result.periods?.length || 0} periods found</p>
                    <p>{result.subjects?.length || 0} subjects found</p>
                    <p>{result.slots?.length || 0} class slots found</p>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    {Array.isArray(result) ? result.length : result.subjects?.length || 0} subjects extracted
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-3 max-h-48 overflow-y-auto">
                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                  {JSON.stringify(result, null, 2).slice(0, 1000)}
                  {JSON.stringify(result, null, 2).length > 1000 ? "\n…" : ""}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground">
                Review above. AI may miss some spanning — you can manually edit any slot after applying.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex gap-2.5">
          {status !== "review" ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 h-10 text-sm text-muted-foreground border border-gray-200
                           dark:border-zinc-700 rounded-xl hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={scan}
                disabled={!file || status === "scanning" || quota?.allowed === false}
                className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-semibold
                           bg-violet-500 hover:bg-violet-600 text-white rounded-xl
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {status === "scanning"
                  ? <><Loader2 size={14} className="animate-spin" /> Scanning…</>
                  : quota?.allowed === false
                    ? <>Limit reached</>
                    : <><Sparkles size={14} /> Scan with AI</>}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={reset}
                className="flex-1 h-10 text-sm text-muted-foreground border border-gray-200
                           dark:border-zinc-700 rounded-xl hover:bg-muted transition-colors">
                Re-scan
              </button>
              <button
                onClick={apply}
                className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-semibold
                           bg-violet-500 hover:bg-violet-600 text-white rounded-xl transition-colors">
                <Check size={14} /> Apply
              </button>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  )
}