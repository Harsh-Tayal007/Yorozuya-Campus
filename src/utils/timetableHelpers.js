// src/utils/timetableHelpers.js

export const uid = () => crypto.randomUUID()

export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function formatTime(t) {
  if (!t) return ""
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hh}:${m.toString().padStart(2, "0")} ${ampm}`
}

export function getNowPeriod(periods) {
  const now  = new Date()
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  return periods.find(p => p.start <= time && time < p.end)
}

export function getTodayDay() {
  return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date().getDay()]
}

export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result.split(",")[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export const CLASS_TYPES = [
  { value: "lecture",  label: "Lecture",  color: "#6366f1" },
  { value: "lab",      label: "Lab",      color: "#10b981" },
  { value: "tutorial", label: "Tutorial", color: "#f59e0b" },
]