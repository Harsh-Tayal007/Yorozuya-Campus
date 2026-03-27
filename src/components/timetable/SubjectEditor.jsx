// src/components/timetable/SubjectEditor.jsx
import { useState } from "react"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { SUBJECT_COLORS } from "@/stores/useTimetableStore"
import { ColorPicker } from "./TimetableColorPicker"

export function SubjectEditor({ subjects, onAdd, onUpdate, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [form,   setForm]   = useState({ name: "", teacher: "", room: "", color: SUBJECT_COLORS[0] })
  const [editId, setEditId] = useState(null)

  const submit = () => {
    if (!form.name.trim()) return
    if (editId) { onUpdate(editId, form); setEditId(null) }
    else        { onAdd(form) }
    setForm({ name: "", teacher: "", room: "", color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length] })
    setAdding(false)
  }

  const startEdit = (sub) => {
    setForm({ name: sub.name, teacher: sub.teacher || "", room: sub.room || "", color: sub.color })
    setEditId(sub.id)
    setAdding(true)
  }

  return (
    <div className="space-y-2">
      {subjects.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center py-4">No subjects yet. Add your first subject below.</p>
      )}

      {subjects.map(sub => (
        <div key={sub.id}
          className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800
                     bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
          <div className="w-3 h-3 rounded shrink-0" style={{ background: sub.color }}/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{sub.name}</p>
            {(sub.teacher || sub.room) && (
              <p className="text-xs text-muted-foreground truncate">
                {[sub.teacher, sub.room].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button onClick={() => startEdit(sub)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Edit2 size={13}/>
          </button>
          <button onClick={() => onRemove(sub.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      ))}

      {adding ? (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800/50
                        bg-violet-50 dark:bg-violet-950/30 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1 block">Subject Name *</label>
              <input autoFocus value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="e.g. Operating Systems"
                className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                           bg-white dark:bg-zinc-800 text-foreground
                           focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
            </div>
            {[
              { key: "teacher", label: "Teacher", placeholder: "Dr. Rewa" },
              { key: "room",    label: "Room",    placeholder: "IT-02"   },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1 block">{label}</label>
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-zinc-700
                             bg-white dark:bg-zinc-800 text-foreground
                             focus:outline-none focus:ring-1 focus:ring-violet-400 transition-colors"/>
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2 block">Color</label>
            <ColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))}/>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setAdding(false); setEditId(null) }}
              className="flex-1 h-9 text-sm text-muted-foreground border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={submit} disabled={!form.name.trim()}
              className="flex-1 h-9 text-sm font-semibold bg-violet-500 hover:bg-violet-600
                         text-white rounded-lg disabled:opacity-40 transition-colors">
              {editId ? "Update" : "Add Subject"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setAdding(true)
            setForm(f => ({ ...f, color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length] }))
          }}
          className="w-full flex items-center justify-center gap-1.5 h-9 text-xs
                     text-muted-foreground border border-dashed border-border/60 rounded-lg
                     hover:border-violet-400 hover:text-violet-600 transition-colors">
          <Plus size={12}/> Add Subject
        </button>
      )}
    </div>
  )
}