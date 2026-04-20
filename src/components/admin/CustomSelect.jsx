// src/components/admin/CustomSelect.jsx
// Portal-based custom select - escapes ALL stacking contexts / overflow clipping
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check } from "lucide-react"

export function CustomSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef          = useRef(null)
  const dropdownRef         = useRef(null)
  const selected            = options.find(o => String(o.value) === String(value))

  const calcCoords = () => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setCoords({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width })
  }

  const handleToggle = () => { if (!disabled) { if (!open) calcCoords(); setOpen(v => !v) } }

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [open])

  useEffect(() => {
    if (!open) return
    const update = () => calcCoords()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update) }
  }, [open])

  useEffect(() => () => setOpen(false), [])

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div ref={dropdownRef}
          initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
          transition={{ duration: 0.13, ease: "easeOut" }}
          style={{ position: "absolute", top: coords.top, left: coords.left, width: coords.width, zIndex: 99999, transformOrigin: "top" }}
          className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto py-1">
            {options.length === 0
              ? <p className="px-4 py-3 text-sm text-muted-foreground">No options available</p>
              : options.map(opt => {
                  const isActive = String(opt.value) === String(value)
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => { onChange(opt.value); setOpen(false) }}
                      className={[
                        "flex items-center justify-between w-full px-4 py-2.5 text-sm text-left gap-3 transition-colors duration-100",
                        isActive ? "bg-violet-500/10 text-violet-400 font-semibold" : "text-foreground hover:bg-muted/60",
                      ].join(" ")}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isActive && <Check size={13} className="text-violet-400 shrink-0" />}
                    </button>
                  )
                })
            }
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative w-full">
      <button ref={triggerRef} type="button" onClick={handleToggle}
        className={[
          "w-full h-10 px-3.5 rounded-xl border text-sm text-left",
          "flex items-center justify-between gap-2 select-none outline-none transition-all duration-150",
          disabled
            ? "border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed pointer-events-none"
            : open
              ? "border-violet-500/60 bg-card ring-2 ring-violet-500/20 text-foreground"
              : "border-border/60 bg-card/80 text-foreground hover:border-border cursor-pointer",
        ].join(" ")}
      >
        <span className={selected ? "text-foreground truncate" : "text-muted-foreground/60"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={["shrink-0 transition-transform duration-200",
          disabled ? "text-muted-foreground/30" : "text-muted-foreground", open ? "rotate-180" : ""].join(" ")} />
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  )
}

export function SectionLabel({ children }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{children}</p>
}

export function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 ${className}`}>
      {children}
    </div>
  )
}