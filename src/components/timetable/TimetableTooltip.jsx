// src/components/ui/Tooltip.jsx
import { useState, useRef } from "react"
import { createPortal } from "react-dom"

export function Tooltip({ text, children }) {
  const [show, setShow]   = useState(false)
  const [style, setStyle] = useState({})
  const ref = useRef(null)

  const handleEnter = () => {
    if (!ref.current) return
    const r  = ref.current.getBoundingClientRect()
    const TW = 220
    let left = r.left + r.width / 2 - TW / 2
    left = Math.max(8, Math.min(left, window.innerWidth - TW - 8))
    const above = r.top > window.innerHeight / 2
    setStyle({
      position: "fixed", zIndex: 10000, width: TW, left,
      ...(above ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
    })
    setShow(true)
  }

  return (
    <span ref={ref} className="inline-flex items-center"
          onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && createPortal(
        <span className="pointer-events-none px-2.5 py-1.5 rounded-lg text-xs leading-relaxed
                         bg-gray-900 dark:bg-zinc-700 text-white shadow-xl whitespace-normal block"
              style={style}>{text}</span>,
        document.body
      )}
    </span>
  )
}

export function InfoBadge({ tip }) {
  return (
    <Tooltip text={tip}>
      <span className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full
                       bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400
                       text-[9px] font-bold cursor-default select-none
                       hover:bg-violet-100 dark:hover:bg-violet-800/40
                       hover:text-violet-600 dark:hover:text-violet-400 transition-colors">i</span>
    </Tooltip>
  )
}