// src/hooks/useTimetableActions.js
import { useState, useCallback } from "react"
import { useTimetableStore, SUBJECT_COLORS } from "@/stores/useTimetableStore"
import { exportTimetablePDF, exportTimetableImage } from "@/utils/timetableExport"
import { uid } from "@/utils/timetableHelpers"

/**
 * Encapsulates save, export, and AI-apply side effects so
 * TimetableBuilder.jsx stays thin and focused on layout/routing.
 */
export function useTimetableActions() {
  const store = useTimetableStore()
  const { save, saveAsNew, addSubject, applyAIScan, name, activeDays } = store

  // ── Save state ──────────────────────────────────────────────────────────────
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [saveError,   setSaveError]   = useState("")
  const [saveNewName, setSaveNewName] = useState("")
  const [showSaveNew, setShowSaveNew] = useState(false)

  // ── Export state ────────────────────────────────────────────────────────────
  const [exporting,    setExporting]    = useState(false)
  const [imgExporting, setImgExporting] = useState(false)

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaveError("")
    const res = await save()
    if (res.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setSaveError(res.error || "Save failed")
    }
  }, [save])

  const handleSaveNew = useCallback(async () => {
    if (!saveNewName.trim()) return
    const res = await saveAsNew(saveNewName.trim())
    if (res.success) {
      setShowSaveNew(false)
      setSaveNewName("")
    } else {
      setSaveError(res.error)
    }
  }, [saveAsNew, saveNewName])

  const handleExportPDF = useCallback(async () => {
    setExporting(true)
    try { await exportTimetablePDF(store) }
    finally { setExporting(false) }
  }, [store])

  const handleExportImage = useCallback(async () => {
    setImgExporting(true)
    try { await exportTimetableImage(name) }
    catch (e) { console.error(e) }
    finally { setImgExporting(false) }
  }, [name])

  const handleAIApply = useCallback((result, mode) => {
    if (mode === "subjects") {
      const rawList = Array.isArray(result) ? result : (result.subjects || [])
      rawList.forEach((s, i) =>
        addSubject({
          id:      uid(),
          name:    s.name    || "",
          teacher: s.teacher || "",
          room:    s.room    || "",
          color:   SUBJECT_COLORS[i % SUBJECT_COLORS.length],
        })
      )
    } else {
      const newPeriods  = (result.periods  || []).map(p => ({ ...p, id: uid() }))
      const newSubjects = (result.subjects || []).map((s, i) => ({
        id:      uid(),
        name:    s.name    || "",
        teacher: s.teacher || "",
        room:    s.room    || "",
        color:   s.color   || SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      }))
      const newSlots = (result.slots || []).map(sl => {
        const subject = newSubjects.find(s => s.name.toLowerCase() === (sl.subjectName || "").toLowerCase())
        const period  = newPeriods.find(p => p.label === sl.periodLabel)
        if (!subject || !period) return null
        return {
          id:          uid(),
          subjectId:   subject.id,
          day:         sl.day,
          periodId:    period.id,
          span:        sl.span || 1,
          type:        sl.type || "lecture",
          room:        sl.room    || "",
          teacher:     sl.teacher || "",
          note:        "",
          isRecurring: true,
        }
      }).filter(Boolean)

      applyAIScan({
        name:       result.name || name,
        periods:    newPeriods,
        subjects:   newSubjects,
        slots:      newSlots,
        activeDays: result.activeDays || activeDays,
      })
    }
  }, [addSubject, applyAIScan, name, activeDays])

  return {
    // save
    saving, saved, saveError, setSaveError,
    saveNewName, setSaveNewName,
    showSaveNew, setShowSaveNew,
    handleSave, handleSaveNew,
    // export
    exporting, imgExporting,
    handleExportPDF, handleExportImage,
    // AI
    handleAIApply,
  }
}