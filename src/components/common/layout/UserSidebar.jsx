// src/components/common/navigation/UserSidebar.jsx
import { useLocation, Link } from "react-router-dom"
import { useEffect, useState, useCallback } from "react"
import { Pin, PinOff, X, ChevronDown, Lock, Search } from "lucide-react"
import { useSidebar } from "@/context/SidebarContext"
import { useAuth } from "@/context/AuthContext"
import {
  dashboardRootLink,
  dashboardSidebarSections,
  forumRootLink,
  homeRootLink,
  updatesRootLink,
} from "@/config/dashboardSidebarConfig"
import LoginGateSheet from "@/components/common/auth/LoginGateSheet"
import UserSearchModal from "@/components/profile/UserSearchModal"
import GlareHover from "@/components/ui/glare-hover"
import { useUIPrefs } from "@/context/UIPrefsContext"


const NAVBAR_H  = 68
const SIDEBAR_W = 256

export { SIDEBAR_W, NAVBAR_H }

// ── Derive active section label from current path ─────────────────────────────
function useActiveSectionLabel(location) {
  const allLinks = [homeRootLink, forumRootLink, dashboardRootLink]

  for (const link of allLinks) {
    const match = link.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(link.path)
    if (match) return link.label
  }

  for (const section of dashboardSidebarSections) {
    for (const child of section.children) {
      if (location.pathname.startsWith(child.path)) return section.label
    }
  }

  return "Unizuya"
}

export default function UserSidebar() {
  const {
    isOpen, setIsOpen,
    isPinned, isMobile,
    togglePin, handleSidebarLeave,
  } = useSidebar()

  const location   = useLocation()
  const { user }   = useAuth()
  const isLoggedIn = !!user

  const [openSections, setOpenSections]   = useState([])
  const [gateSheet, setGateSheet]         = useState({ open: false, feature: "", redirect: "" })
  const [searchOpen, setSearchOpen]       = useState(false)

  const openGate = useCallback((featureName, redirectTo) => {
    setGateSheet({ open: true, feature: featureName, redirect: redirectTo })
  }, [])
  const closeGate = useCallback(() => {
    setGateSheet(s => ({ ...s, open: false }))
  }, [])

  const activeLabel = useActiveSectionLabel(location)

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) setIsOpen(false)
  }, [location.pathname, isMobile])

  // Auto-open the active section
  useEffect(() => {
    const active = dashboardSidebarSections.find(s =>
      s.children.some(c => location.pathname.startsWith(c.path))
    )
    if (active) {
      setOpenSections(prev =>
        prev.includes(active.id) ? prev : [...prev, active.id]
      )
    }
  }, [location.pathname])

  // Global "/" shortcut to open search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && !e.target.matches("input,textarea,[contenteditable]")) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const visible  = isOpen || isPinned
  const topLinks = [homeRootLink, forumRootLink, updatesRootLink]

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        onMouseLeave={handleSidebarLeave}
        style={{
          top:       isMobile ? 0 : NAVBAR_H,
          width:     SIDEBAR_W,
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          zIndex:    50,
        }}
        className="fixed left-0 bottom-0
                   flex flex-col
                   bg-white/80 dark:bg-[#0b1220]/95
                   backdrop-blur-xl backdrop-saturate-150
                   border-r border-white/10 dark:border-white/5
                   shadow-[4px_0_24px_rgba(0,0,0,0.12)]
                   transition-transform duration-200 ease-in-out
                   overflow-hidden"
      >
        {/* ── Header: active section + pin button ── */}
        <div className="flex items-center justify-between px-4 py-3
                        border-b border-border/40 shrink-0 min-h-[52px]">
          <span className="text-xs font-semibold uppercase tracking-widest
                           text-muted-foreground/60 truncate select-none">
            {activeLabel}
          </span>

          <button
            onClick={togglePin}
            title={isMobile ? "Close" : isPinned ? "Unpin sidebar" : "Pin sidebar"}
            className="p-1.5 rounded-lg text-muted-foreground
                       hover:text-foreground hover:bg-muted
                       transition-colors duration-150 shrink-0 cursor-target"
          >
            {isMobile
              ? <X size={15} />
              : isPinned
                ? <PinOff size={14} />
                : <Pin size={14} />
            }
          </button>
        </div>

        {/* ── Search users button ── */}
        <div className="px-2 pt-3 pb-1 shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                       text-sm text-muted-foreground
                       hover:text-foreground hover:bg-muted
                       border border-border/50
                       transition-colors duration-150 group cursor-target"
          >
            <Search size={13} className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="flex-1 text-left text-xs opacity-60 group-hover:opacity-100 transition-opacity">
              Search users…
            </span>
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono
                            text-muted-foreground/60 border border-border/60
                            group-hover:border-border transition-colors">
              /
            </kbd>
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5">

          {topLinks.map(item => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)
            return (
              <SidebarLink
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
              />
            )
          })}

          {isLoggedIn ? (
            <SidebarLink
              to={dashboardRootLink.path}
              icon={dashboardRootLink.icon}
              label={dashboardRootLink.label}
              isActive={location.pathname.startsWith(dashboardRootLink.path)}
            />
          ) : (
            <SidebarLinkLocked
              icon={dashboardRootLink.icon}
              label={dashboardRootLink.label}
              onLockClick={() => openGate("Dashboard", dashboardRootLink.path)}
            />
          )}

          <div className="h-px bg-border/40 mx-1 my-2" />

          {dashboardSidebarSections.map(section => {
            const isTeacher = user?.accountType === "teacher" || user?.role === "teacher"
            const isGuestLocked   = !isLoggedIn && section.lockedForPublic
            const isTeacherLocked = isTeacher && section.id === "academics"
            const sectionLocked   = isGuestLocked || isTeacherLocked
            const isExpanded      = openSections.includes(section.id)
            const SIcon           = section.icon

            return (
              <div key={section.id}>
                <button
                  onClick={() => {
                    if (isGuestLocked) {
                      openGate(section.label, section.children[0]?.path ?? "/login")
                      return
                    }
                    if (isTeacherLocked) {
                      // Silently prevent opening for teachers
                      return
                    }
                    setOpenSections(prev =>
                      prev.includes(section.id)
                        ? prev.filter(id => id !== section.id)
                        : [...prev, section.id]
                    )
                  }}
                  className={`w-full flex items-center justify-between
                               px-3 py-2 rounded-lg
                               text-xs font-semibold uppercase tracking-wide
                               transition-colors duration-150
                               ${sectionLocked
                                 ? "text-muted-foreground/40 hover:text-muted-foreground/60 " + (isTeacherLocked ? "cursor-not-allowed" : "cursor-pointer")
                                 : "text-muted-foreground hover:text-foreground hover:bg-muted"
                               }`}
                >
                  <div className="flex items-center gap-2">
                    <SIcon size={13} className={sectionLocked ? "opacity-40" : ""} />
                    <span className={sectionLocked ? "opacity-40" : ""}>{section.label}</span>
                    {section.badge && !sectionLocked && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]
                                       font-semibold leading-none
                                       bg-indigo-500 text-white">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  {sectionLocked
                    ? <Lock size={11} className="opacity-40 shrink-0" />
                    : <ChevronDown
                        size={13}
                        className={`transition-transform duration-200
                                    ${isExpanded ? "rotate-180" : ""}`}
                      />
                  }
                </button>

                {isExpanded && !sectionLocked && (
                  <div className="ml-4 border-l border-border/40 pl-2
                                  mt-0.5 space-y-0.5">
                    {section.children.map(item => {
                      if (item.soon) {
                        return (
                          <SidebarLinkSoon
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                          />
                        )
                      }
                      const isActive = location.pathname.startsWith(item.path)
                      return (
                        <SidebarLink
                          key={item.path}
                          to={item.path}
                          icon={item.icon}
                          label={item.label}
                          isActive={isActive}
                          small
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <LoginGateSheet
          isOpen={gateSheet.open}
          onClose={closeGate}
          featureName={gateSheet.feature}
          redirectTo={gateSheet.redirect}
        />
      </aside>

      {/* ── User Search Modal (portal-level, outside aside) ── */}
      <UserSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

function SidebarLink({ to, icon: Icon, label, isActive, small }) {
  const { resolved } = useUIPrefs()
  const glareEnabled = resolved.glareHover
  const [isHovered, setIsHovered] = useState(false)


  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-2.5 rounded-lg
                  transition-colors duration-150 whitespace-nowrap cursor-target
                  ${small ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm font-medium"}
                  ${isActive
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlareHover enabled={glareEnabled} active={isHovered} />

      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5
                         rounded-r bg-indigo-500" />
      )}
      <Icon size={small ? 14 : 16} className="shrink-0 relative z-20" />
      <span className="relative z-20">{label}</span>
    </Link>
  )
}

function SidebarLinkLocked({ icon: Icon, label, onLockClick }) {
  const { resolved } = useUIPrefs()
  const glareEnabled = resolved.glareHover
  const [isHovered, setIsHovered] = useState(false)


  return (
    <button
      onClick={onLockClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full group relative flex items-center justify-between gap-2.5
                 rounded-lg px-3 py-2 text-sm font-medium
                 text-muted-foreground/50 hover:text-muted-foreground
                 hover:bg-muted/50 transition-colors duration-150 cursor-pointer cursor-target"
    >
      <GlareHover enabled={glareEnabled} active={isHovered} />

      <div className="flex items-center gap-2.5 relative z-20">
        <Icon size={16} className="shrink-0 opacity-50" />
        <span className="opacity-50">{label}</span>
      </div>
      <Lock size={12} className="shrink-0 opacity-40 group-hover:opacity-70
                                  transition-opacity duration-150 relative z-20" />
    </button>
  )
}

function SidebarLinkSoon({ icon: Icon, label }) {
  return (
    <div
      className="relative flex items-center justify-between gap-2.5 rounded-lg
                 px-2.5 py-1.5 text-xs
                 text-muted-foreground/40 cursor-not-allowed select-none"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={14} className="shrink-0 opacity-40" />
        {label}
      </div>
      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium leading-none
                       border border-border/40 text-muted-foreground/50">
        soon
      </span>
    </div>
  )
}