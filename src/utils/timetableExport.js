// src/utils/timetableExport.js
import { DAYS } from "@/stores/useTimetableStore"

export async function exportTimetablePDF(store) {
  const { jsPDF } = await import("jspdf")
  const { name, periods, subjects, slots, activeDays } = store
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const W = 297, H = 210, pad = 10

  const visibleDays    = DAYS.filter(d => activeDays.includes(d))
  const visiblePeriods = periods
  const C = {
    header:  [109, 40, 217],
    bg:      [248, 248, 251],
    white:   [255, 255, 255],
    text:    [15, 15, 25],
    muted:   [100, 110, 125],
    border:  [220, 220, 230],
    breakBg: [255, 251, 235],
  }

  doc.setFillColor(...C.header)
  doc.rect(0, 0, W, 18, "F")
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(name, pad, 11)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(220, 210, 255)
  doc.text(`Unizuya  ·  ${new Date().toLocaleDateString("en-IN")}`, W - pad, 11, { align: "right" })

  const startY    = 22
  const rowH      = Math.min(22, (H - startY - 8) / (visiblePeriods.length + 1))
  const labelColW = 22
  const dayColW   = (W - pad * 2 - labelColW) / visibleDays.length

  doc.setFillColor(...C.bg)
  doc.rect(pad, startY, W - pad * 2, rowH, "F")
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...C.muted)
  doc.text("PERIOD", pad + labelColW / 2, startY + rowH / 2 + 2, { align: "center" })
  visibleDays.forEach((day, di) => {
    const x = pad + labelColW + di * dayColW
    doc.text(day, x + dayColW / 2, startY + rowH / 2 + 2, { align: "center" })
  })

  visiblePeriods.forEach((period, pi) => {
    const y = startY + rowH * (pi + 1)
    if (period.isBreak) {
      doc.setFillColor(...C.breakBg)
      doc.rect(pad, y, W - pad * 2, rowH, "F")
    }

    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...(period.isBreak ? [180, 120, 0] : C.text))
    doc.text(period.label, pad + labelColW / 2, y + rowH / 2 + 1, { align: "center" })
    doc.setFontSize(5.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.muted)
    doc.text(period.start, pad + labelColW / 2, y + rowH / 2 + 5, { align: "center" })

    visibleDays.forEach((day, di) => {
      const cx   = pad + labelColW + di * dayColW
      const slot = slots.find(sl => sl.day === day && sl.periodId === period.id)
      const subj = slot ? subjects.find(s => s.id === slot.subjectId) : null

      if (period.isBreak) {
        doc.setFontSize(5.5)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(180, 120, 0)
        doc.text("BREAK", cx + dayColW / 2, y + rowH / 2 + 2, { align: "center" })
        return
      }

      if (subj) {
        const r = parseInt(subj.color.slice(1, 3), 16)
        const g = parseInt(subj.color.slice(3, 5), 16)
        const b = parseInt(subj.color.slice(5, 7), 16)
        doc.setFillColor(r + Math.floor((255 - r) * 0.85), g + Math.floor((255 - g) * 0.85), b + Math.floor((255 - b) * 0.85))
        doc.roundedRect(cx + 1, y + 1, dayColW - 2, rowH * (slot.span || 1) - 2, 1.5, 1.5, "F")
        doc.setFillColor(r, g, b)
        doc.rect(cx + 1, y + 1, 2, rowH * (slot.span || 1) - 2, "F")
        doc.setFontSize(6)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(r, g, b)
        doc.text(subj.name.slice(0, 16), cx + 5, y + 5)
        doc.setFontSize(5.5)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...C.muted)
        if (slot.room || subj.room)       doc.text((slot.room || subj.room).slice(0, 12), cx + 5, y + 9)
        if (slot.teacher || subj.teacher) doc.text((slot.teacher || subj.teacher).slice(0, 14), cx + 5, y + 13)
      }
    })

    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.2)
    doc.line(pad, y, W - pad, y)
    visibleDays.forEach((_, di) =>
      doc.line(pad + labelColW + di * dayColW, startY, pad + labelColW + di * dayColW, startY + rowH * (visiblePeriods.length + 1))
    )
  })

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.4)
  doc.rect(pad, startY, W - pad * 2, rowH * (visiblePeriods.length + 1))

  let lx = pad
  let ly = startY + rowH * (visiblePeriods.length + 1) + 5
  subjects.forEach(sub => {
    if (lx + 35 > W - pad) { lx = pad; ly += 5 }
    const r = parseInt(sub.color.slice(1, 3), 16)
    const g = parseInt(sub.color.slice(3, 5), 16)
    const b = parseInt(sub.color.slice(5, 7), 16)
    doc.setFillColor(r, g, b)
    doc.circle(lx + 1.5, ly + 1, 1.5, "F")
    doc.setFontSize(5.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.text)
    doc.text(sub.name.slice(0, 18), lx + 5, ly + 1.8)
    lx += 38
  })

  doc.save(`${name.replace(/\s+/g, "_")}_timetable.pdf`)
}

export async function exportTimetableImage(name) {
  await new Promise((res, rej) => {
    if (window.html2canvas) { res(); return }
    const s = document.createElement("script")
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
    s.onload = res
    s.onerror = rej
    document.head.appendChild(s)
  })
  const el = document.getElementById("timetable-grid-export")
  if (!el) return
  const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
  const a = document.createElement("a")
  a.href = canvas.toDataURL("image/png")
  a.download = `${name.replace(/\s+/g, "_")}_timetable.png`
  a.click()
}