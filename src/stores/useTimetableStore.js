// src/stores/useTimetableStore.js
import { create } from "zustand"
import { databases, account } from "@/lib/appwrite"
import { ID, Query } from "appwrite"

const DATABASE_ID   = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_TIMETABLES_COLLECTION_ID || "timetables"

const uid = () => crypto.randomUUID()

// ── Default period templates ──────────────────────────────────────────────────
export const DEFAULT_PERIODS = [
  { id: uid(), label: "I",    start: "09:00", end: "09:55" },
  { id: uid(), label: "II",   start: "09:55", end: "10:50" },
  { id: uid(), label: "III",  start: "10:50", end: "11:45" },
  { id: uid(), label: "IV",   start: "11:45", end: "12:40" },
  { id: uid(), label: "BREAK",start: "12:40", end: "13:30", isBreak: true },
  { id: uid(), label: "V",    start: "13:30", end: "14:25" },
  { id: uid(), label: "VI",   start: "14:25", end: "15:20" },
  { id: uid(), label: "VII",  start: "15:20", end: "16:15" },
  { id: uid(), label: "VIII", start: "16:15", end: "17:10" },
]

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]

export const SUBJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#10b981", "#06b6d4",
  "#3b82f6", "#84cc16", "#a855f7", "#14b8a6",
]

// ── Store ─────────────────────────────────────────────────────────────────────
export const useTimetableStore = create((set, get) => ({
  // Active timetable state
  timetableId:  null,
  name:         "My Timetable",
  periods:      DEFAULT_PERIODS.map(p => ({ ...p, id: uid() })),
  subjects:     [],   // [{ id, name, color, teacher, room, type }]
  slots:        [],   // [{ id, subjectId, day, periodId, span, type, room, teacher, note, isRecurring, specificDate }]
  activeDays:   ["MON", "TUE", "WED", "THU", "FRI"],

  // Saved timetables list
  savedTimetables: [],
  loading:         true,
  saving:          false,
  userId:          null,

  // ── Init ──────────────────────────────────────────────────────────────────
  init: async () => {
    try {
      const user = await account.get()
      set({ userId: user.$id })
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
      ])
      const docs = res.documents
      set({ savedTimetables: docs })

      // Load the active timetable (isActive = true) or most recent
      const active = docs.find(d => d.isActive) || docs[0]
      if (active) {
        get().loadFromDoc(active)
      }
    } catch (_) {}
    finally { set({ loading: false }) }
  },

  loadFromDoc: (doc) => {
    set({
      timetableId: doc.$id,
      name:        doc.name,
      periods:     JSON.parse(doc.periods   || "[]"),
      subjects:    JSON.parse(doc.subjects  || "[]"),
      slots:       JSON.parse(doc.slots     || "[]"),
      activeDays:  JSON.parse(doc.activeDays|| '["MON","TUE","WED","THU","FRI"]'),
    })
  },

  // ── Periods ───────────────────────────────────────────────────────────────
  setPeriods: (periods) => set({ periods }),
  addPeriod: (period) => set(s => ({ periods: [...s.periods, { id: uid(), ...period }] })),
  updatePeriod: (id, data) => set(s => ({ periods: s.periods.map(p => p.id === id ? { ...p, ...data } : p) })),
  removePeriod: (id) => set(s => ({
    periods: s.periods.filter(p => p.id !== id),
    slots:   s.slots.filter(sl => sl.periodId !== id),
  })),

  // ── Subjects ──────────────────────────────────────────────────────────────
  addSubject: (subj) => set(s => ({
    subjects: [...s.subjects, {
      id:      uid(),
      color:   SUBJECT_COLORS[s.subjects.length % SUBJECT_COLORS.length],
      ...subj,
    }]
  })),
  updateSubject: (id, data) => set(s => ({ subjects: s.subjects.map(sub => sub.id === id ? { ...sub, ...data } : sub) })),
  removeSubject: (id) => set(s => ({
    subjects: s.subjects.filter(sub => sub.id !== id),
    slots:    s.slots.filter(sl => sl.subjectId !== id),
  })),

  // ── Slots ─────────────────────────────────────────────────────────────────
  addSlot: (slot) => set(s => ({ slots: [...s.slots, { id: uid(), span: 1, isRecurring: true, ...slot }] })),
  updateSlot: (id, data) => set(s => ({ slots: s.slots.map(sl => sl.id === id ? { ...sl, ...data } : sl) })),
  removeSlot: (id) => set(s => ({ slots: s.slots.filter(sl => sl.id !== id) })),

  // ── Active days ───────────────────────────────────────────────────────────
  setActiveDays: (days) => set({ activeDays: days }),

  // ── Name ─────────────────────────────────────────────────────────────────
  setName: (name) => set({ name }),

  // ── Reset ─────────────────────────────────────────────────────────────────
  reset: () => set({
    timetableId: null,
    name:        "My Timetable",
    periods:     DEFAULT_PERIODS.map(p => ({ ...p, id: uid() })),
    subjects:    [],
    slots:       [],
    activeDays:  ["MON", "TUE", "WED", "THU", "FRI"],
  }),

  // ── Apply AI scan result ──────────────────────────────────────────────────
  applyAIScan: ({ periods, subjects, slots, activeDays, name }) => {
    set({
      name:       name || get().name,
      periods:    periods    || get().periods,
      subjects:   subjects   || get().subjects,
      slots:      slots      || get().slots,
      activeDays: activeDays || get().activeDays,
    })
  },

  // ── Save ──────────────────────────────────────────────────────────────────
  save: async () => {
    const { userId, timetableId, name, periods, subjects, slots, activeDays, savedTimetables } = get()
    if (!userId) return { error: "Not logged in" }
    set({ saving: true })

    const data = {
      userId,
      name,
      periods:    JSON.stringify(periods),
      subjects:   JSON.stringify(subjects),
      slots:      JSON.stringify(slots),
      activeDays: JSON.stringify(activeDays),
      isActive:   true,
      savedAt:    new Date().toISOString(),
    }

    try {
      let doc
      if (timetableId) {
        doc = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, timetableId, data)
        set({ savedTimetables: savedTimetables.map(d => d.$id === timetableId ? doc : d) })
      } else {
        doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data)
        set({ timetableId: doc.$id, savedTimetables: [doc, ...savedTimetables] })
      }
      return { success: true }
    } catch (e) {
      return { error: e.message }
    } finally {
      set({ saving: false })
    }
  },

  saveAsNew: async (newName) => {
    const { userId, periods, subjects, slots, activeDays } = get()
    if (!userId) return { error: "Not logged in" }
    set({ saving: true })
    try {
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        userId,
        name:       newName,
        periods:    JSON.stringify(periods),
        subjects:   JSON.stringify(subjects),
        slots:      JSON.stringify(slots),
        activeDays: JSON.stringify(activeDays),
        isActive:   false,
        savedAt:    new Date().toISOString(),
      })
      set(s => ({ savedTimetables: [doc, ...s.savedTimetables] }))
      return { success: true, doc }
    } catch (e) {
      return { error: e.message }
    } finally {
      set({ saving: false })
    }
  },

  deleteSaved: async (id) => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id)
      set(s => ({
        savedTimetables: s.savedTimetables.filter(d => d.$id !== id),
        timetableId: s.timetableId === id ? null : s.timetableId,
      }))
    } catch (e) { console.error(e) }
  },
}))