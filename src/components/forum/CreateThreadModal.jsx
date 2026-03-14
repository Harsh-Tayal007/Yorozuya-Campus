import { useState, useEffect, useRef } from "react"
import { useCreateThread } from "@/services/forum/useCreateThread"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useUniversities, usePrograms, useBranches } from "@/hooks/useAcademicDropdowns"
import { X, ChevronDown } from "lucide-react"

// ── Reusable custom dropdown ──────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`w-full h-9 px-3 rounded-lg border text-sm flex items-center justify-between
                    transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                    ${value ? "border-primary/50 text-foreground" : "border-border text-muted-foreground"}
                    bg-background hover:border-primary/40`}
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ml-2
                                           ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full z-[300] rounded-xl border border-border
                        bg-background shadow-xl overflow-hidden max-h-48 overflow-y-auto
                        animate-in fade-in-0 zoom-in-95 duration-100 origin-top-left">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm
                          transition-colors hover:bg-muted text-left
                          ${value === o.value ? "text-primary font-semibold" : "text-foreground"}`}
            >
              {o.label}
              {value === o.value && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
export default function CreateThreadModal({
  open, onClose,
  derivedTab,
  selectedUniversity, selectedCourse, selectedBranch,
  currentUser,
}) {
  const { mutate, isPending } = useCreateThread()

  // ── State first — hooks below depend on these ─────────────────────────────
  const [title,           setTitle]           = useState("")
  const [content,         setContent]         = useState("")
  const [localUniversity, setLocalUniversity] = useState(selectedUniversity)
  const [localCourse,     setLocalCourse]     = useState(selectedCourse)
  const [localBranch,     setLocalBranch]     = useState(selectedBranch)

  // ── Academic data — must come AFTER state so localUniversity/localCourse exist
  const { data: universities = [] } = useUniversities()
  const { data: programs = [] }     = usePrograms(localUniversity)
  const { data: branches = [] }     = useBranches(localCourse)

  // Derived display values for context chips
  const localUniversityData = universities.find(u => u.$id === localUniversity)
  const localCourseData     = programs.find(p => p.$id === localCourse)
  const localBranchData     = branches.find(b => b.$id === localBranch)

  useEffect(() => {
    if (open) {
      setLocalUniversity(selectedUniversity)
      setLocalCourse(selectedCourse)
      setLocalBranch(selectedBranch)
      setTitle("")
      setContent("")
    }
  }, [open, selectedUniversity, selectedCourse, selectedBranch])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  const canSubmit = title.trim() && content.trim() && localUniversity && localCourse && localBranch

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    mutate(
      {
        title: title.trim(), content: content.trim(),
        universityId: localUniversity, courseId: localCourse, branchId: localBranch,
        authorId: currentUser.$id, authorName: currentUser.name,
      },
      { onSuccess: () => { setTitle(""); setContent(""); onClose() } }
    )
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full sm:max-w-lg
                   bg-background border border-border/60
                   rounded-t-2xl sm:rounded-2xl shadow-2xl
                   max-h-[92dvh] sm:max-h-[85vh] flex flex-col
                   animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
          <h2 className="text-base font-semibold">Create Discussion</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center
                       text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-5 flex-1">

            {/* Context chips — show selected values */}
            {(localUniversityData || localCourseData || localBranchData) && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide
                                 text-muted-foreground self-center mr-1">In:</span>
                {localUniversityData && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {localUniversityData.name}
                  </span>
                )}
                {localCourseData && (
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium">
                    {localCourseData.name}
                  </span>
                )}
                {localBranchData && (
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium">
                    {localBranchData.name}
                  </span>
                )}
              </div>
            )}

            {/* Context selectors */}
            {(derivedTab === "all" || derivedTab === "university" || derivedTab === "course") && (
              <div className="space-y-2.5 border border-border/60 rounded-xl p-3.5 bg-muted/20">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Posting in
                </p>

                {derivedTab === "all" && (
                  <CustomSelect
                    value={localUniversity ?? ""}
                    onChange={v => { setLocalUniversity(v); setLocalCourse(null); setLocalBranch(null) }}
                    options={universities.map(u => ({ value: u.$id, label: u.name }))}
                    placeholder="Select University"
                  />
                )}

                {(derivedTab === "all" || derivedTab === "university") && (
                  <CustomSelect
                    value={localCourse ?? ""}
                    onChange={v => { setLocalCourse(v); setLocalBranch(null) }}
                    options={programs.map(p => ({ value: p.$id, label: p.name }))}
                    placeholder="Select Program"
                    disabled={!localUniversity}
                  />
                )}

                {derivedTab !== "branch" && (
                  <CustomSelect
                    value={localBranch ?? ""}
                    onChange={setLocalBranch}
                    options={branches.map(b => ({ value: b.$id, label: b.name }))}
                    placeholder="Select Branch"
                    disabled={!localCourse}
                  />
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Be specific and clear…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-10 rounded-xl text-sm"
                maxLength={120}
              />
              <p className="text-[11px] text-muted-foreground text-right">{title.length}/120</p>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Discussion</label>
              <Textarea
                placeholder="Explain your question or topic clearly…"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                className="rounded-xl text-sm resize-none"
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="px-5 py-4 border-t border-border/50 shrink-0 bg-background/95">
            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {isPending ? "Posting…"
                : !canSubmit ? "Fill in all fields to continue"
                : "Post Discussion"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}