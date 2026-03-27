// src/components/ui/Dropdown.jsx
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"

/**
 * Both Dropdown and ClickDropdown render their panel into document.body via a
 * portal. The panel is OUTSIDE ref.current in the DOM, so a naive
 * "close if click is outside ref" fires for every click inside the panel.
 * Fix: track the panel with portalRef and exclude it from the outside-click check.
 */
export function Dropdown({ value, onChange, options, placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 })
  const ref       = useRef(null)
  const portalRef = useRef(null)

  const selected = options.find(o => o.value === value)

  const openDd = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const h = (e) => {
      const inTrigger = ref.current?.contains(e.target)
      const inPortal  = portalRef.current?.contains(e.target)
      if (!inTrigger && !inPortal) setOpen(false)
    }
    document.addEventListener("mousedown", h, true)
    document.addEventListener("touchstart", h, true)
    return () => {
      document.removeEventListener("mousedown", h, true)
      document.removeEventListener("touchstart", h, true)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => open ? setOpen(false) : openDd()}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5
                    bg-gray-50 dark:bg-zinc-800 border rounded-xl text-sm transition-all outline-none
                    ${open
                      ? "border-violet-400 dark:border-violet-500 ring-2 ring-violet-400/20"
                      : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
        <span className="flex items-center gap-2 min-w-0 truncate">
          {selected?.dot   && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selected.dot }}/>}
          {selected?.color && <span className="w-3 h-3 rounded shrink-0" style={{ background: selected.color }}/>}
          <span className={selected ? "text-gray-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-600"}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>

      {open && createPortal(
        <div
          ref={portalRef}
          style={{ position: "fixed", ...pos, zIndex: 9999 }}
          className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700
                     rounded-xl shadow-2xl overflow-hidden">
          <div className="py-1 max-h-52 overflow-y-auto">
            {options.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors
                  ${opt.value === value
                    ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}>
                {opt.dot   && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.dot }}/>}
                {opt.color && <span className="w-3 h-3 rounded shrink-0" style={{ background: opt.color }}/>}
                <span className="flex-1">{opt.label}</span>
                {opt.value === value && <Check size={13} className="text-violet-500 shrink-0"/>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export function ClickDropdown({ label, icon: Icon, children, variant = "default" }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState(null)
  const ref       = useRef(null)   // trigger button wrapper
  const portalRef = useRef(null)   // floating panel — lives in document.body portal

  useEffect(() => {
    if (!open || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right, minWidth: r.width })
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e) => {
      // Stay open when clicking INSIDE the trigger or INSIDE the portal panel.
      // Without portalRef the portal is outside ref.current so every click
      // inside it would close the dropdown immediately.
      const inTrigger = ref.current?.contains(e.target)
      const inPortal  = portalRef.current?.contains(e.target)
      if (!inTrigger && !inPortal) {
        setOpen(false)
        setPos(null)
      }
    }
    document.addEventListener("mousedown", h, true)
    document.addEventListener("touchstart", h, true)
    return () => {
      document.removeEventListener("mousedown", h, true)
      document.removeEventListener("touchstart", h, true)
    }
  }, [open])

  const toggle = (e) => {
    e.stopPropagation()
    if (open) { setOpen(false); setPos(null) }
    else setOpen(true)
  }

  const close = () => { setOpen(false); setPos(null) }

  const base = "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors select-none"
  const variants = {
    default: "border border-gray-200 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:border-gray-300",
    violet:  "border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40",
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={toggle} className={`${base} ${variants[variant]}`}>
        {Icon && <Icon size={13}/>}
        {label}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>

      {open && pos && createPortal(
        <div
          ref={portalRef}
          style={{ position: "fixed", top: pos.top, right: pos.right, minWidth: pos.minWidth, zIndex: 9999 }}
          className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700
                     rounded-xl shadow-2xl overflow-hidden">
          {children({ close })}
        </div>,
        document.body
      )}
    </div>
  )
}