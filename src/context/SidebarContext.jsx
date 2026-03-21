// src/context/SidebarContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react"

const SidebarContext = createContext(null)

export const SidebarProvider = ({ children }) => {
  const [isOpen,   setIsOpen]   = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) { setIsOpen(false); setIsPinned(false) }
    }
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // Mobile scroll lock
  useEffect(() => {
    document.body.style.overflow = (isMobile && isOpen) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen, isMobile])

  // Hover left edge on desktop to peek open
  const handleEdgeHover = useCallback((e) => {
    if (!isMobile && !isPinned && e.clientX <= 8) setIsOpen(true)
  }, [isMobile, isPinned])

  // Navbar hamburger — toggles pin on desktop, toggles open on mobile
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen(v => !v)
    } else {
      if (isPinned) { setIsPinned(false); setIsOpen(false) }
      else          { setIsPinned(true);  setIsOpen(true)  }
    }
  }, [isMobile, isPinned])

  // Sidebar internal pin button — same as toggleSidebar on desktop
  const togglePin = useCallback(() => {
    if (isMobile) { setIsOpen(false); setIsPinned(false); return }
    if (isPinned) { setIsPinned(false); setIsOpen(false) }
    else          { setIsPinned(true);  setIsOpen(true)  }
  }, [isMobile, isPinned])

  // Mouse leaves sidebar — close if not pinned
  const handleSidebarLeave = useCallback(() => {
    if (!isMobile && !isPinned) setIsOpen(false)
  }, [isMobile, isPinned])

  return (
    <SidebarContext.Provider value={{
      isOpen, setIsOpen,
      isPinned, setIsPinned,
      isMobile,
      handleEdgeHover,
      handleSidebarLeave,
      toggleSidebar,
      togglePin,
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be inside SidebarProvider")
  return ctx
}