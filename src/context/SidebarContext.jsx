// src/context/SidebarContext.jsx

import { createContext, useContext, useState, useEffect } from "react"

const SidebarContext = createContext(null)

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  const isDesktop = window.innerWidth >= 1024

  const handleEdgeHover = (e) => {
    if (isDesktop && !isPinned && e.clientX <= 8) {
      setIsOpen(true)
    }
  }

  // Mobile scroll lock
  useEffect(() => {
    if (!isDesktop && isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [isOpen, isDesktop])

  const value = {
    isOpen,
    setIsOpen,
    isPinned,
    setIsPinned,
    handleEdgeHover
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used inside SidebarProvider")
  }
  return context
}