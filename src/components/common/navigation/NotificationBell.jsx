// src/components/common/navigation/NotificationBell.jsx
// Changes from original:
//   1. NotifAvatar badge background fixed — now solid color, always visible
//   2. Task reminder type added to TYPE_META
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Bell, CheckCheck, MessageSquare, AtSign, UserPlus, X, CheckSquare, ShieldX, ShieldCheck, ClipboardCheck } from "lucide-react"
import { motion, AnimatePresence, useAnimation, useDragControls, useMotionValue, useTransform } from "framer-motion"
import useNotifications from "@/hooks/useNotifications"

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(dateStr).toLocaleDateString()
}

const stripHtml = (html = "") =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

const TYPE_META = {
  reply: { Icon: MessageSquare, color: "text-white", iconBg: "bg-blue-500", avatarBg: "bg-blue-500/15", ring: "ring-blue-500/30" },
  mention: { Icon: AtSign, color: "text-white", iconBg: "bg-purple-500", avatarBg: "bg-purple-500/15", ring: "ring-purple-500/30" },
  follow: { Icon: UserPlus, color: "text-white", iconBg: "bg-green-500", avatarBg: "bg-green-500/15", ring: "ring-green-500/30" },
  task: { Icon: CheckSquare, color: "text-white", iconBg: "bg-violet-500", avatarBg: "bg-violet-500/15", ring: "ring-violet-500/30" },
  ban: { Icon: ShieldX, color: "text-white", iconBg: "bg-red-500", avatarBg: "bg-red-500/15", ring: "ring-red-500/30" },
  ban_lifted: { Icon: ShieldCheck, color: "text-white", iconBg: "bg-green-500", avatarBg: "bg-green-500/15", ring: "ring-green-500/30" },
  attendance: { Icon: ClipboardCheck, color: "text-white", iconBg: "bg-emerald-500", avatarBg: "bg-emerald-500/15", ring: "ring-emerald-500/30" },
}

// ── Avatar with type badge ─────────────────────────────────────────────────────
const NotifAvatar = ({ notif }) => {
  const meta = TYPE_META[notif.type] ?? TYPE_META.reply
  const { Icon, color, iconBg, avatarBg, ring } = meta

  // Task notifications have no actor — show a task icon instead
  if (notif.type === "task") {
    return (
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarBg} ring-1 ${ring}`}>
          <CheckSquare size={18} className="text-violet-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative shrink-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarBg} ring-1 ${ring} overflow-hidden`}>
        {notif.actorAvatar ? (
          <img src={notif.actorAvatar} alt={notif.actorName}
            className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-sm font-bold text-foreground">
            {notif.actorName?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {/* Badge — solid background so it's always visible on any bg */}
      <div className={`absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full
                       ${iconBg} ring-2 ring-background
                       flex items-center justify-center shadow-sm`}>
        <Icon size={8} className={color} />
      </div>
    </div>
  )
}

// ── Single row ─────────────────────────────────────────────────────────────────
const NotifItem = ({ notif, onRead, onDelete, onNavigate, large = false }) => {
  const handleClick = () => {
    if (!notif.read) onRead(notif.$id)
    onNavigate(notif)
  }

  const rawPreview = (notif.type === "reply" || notif.type === "mention")
    ? stripHtml(notif.replyContent || "")
    : notif.type === "task"
      ? notif.message ?? ""
      : ""
  const preview = rawPreview.length > 100 ? rawPreview.slice(0, 100) + "…" : rawPreview

  const Row = large ? motion.div : "div"
  const rowMotionProps = large
    ? {
      layout: true,
      initial: { opacity: 0, y: -4 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.15 },
    }
    : {}

  return (
    <Row
      {...rowMotionProps}
      onClick={handleClick}
      className={`relative flex items-start gap-3 cursor-pointer
                  transition-colors duration-150 group
                  ${large ? "px-5 py-4" : "px-4 py-3"}
                  ${notif.read
          ? "hover:bg-muted/50"
          : "bg-primary/5 hover:bg-primary/8 border-l-2 border-l-primary/50"}`}
    >
      <NotifAvatar notif={notif} />
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`leading-snug ${large ? "text-sm" : "text-xs"}`}>
          {notif.type === "task" ? (
            <span className="font-semibold text-foreground">{notif.title ?? "Task Reminder"}</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{notif.actorName}</span>
              <span className="text-muted-foreground"> {notif.message}</span>
            </>
          )}
        </p>
        {preview && notif.type !== "task" && (
          <p className={`mt-1.5 text-muted-foreground/70 leading-snug
                          bg-muted/60 rounded-md px-2 py-1.5
                          border-l-2 border-border italic line-clamp-2
                          ${large ? "text-xs" : "text-[11px]"}`}>
            "{preview}"
          </p>
        )}
        {notif.type === "task" && notif.message && (
          <p className={`mt-0.5 text-muted-foreground/70 ${large ? "text-xs" : "text-[11px]"}`}>
            {notif.message}
          </p>
        )}
        <p className={`text-muted-foreground/40 mt-1 ${large ? "text-xs" : "text-[10px]"}`}>
          {timeAgo(notif.$createdAt)}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notif.$id) }}
        className={`shrink-0 transition-opacity p-1.5 rounded-lg
                    text-muted-foreground hover:text-foreground hover:bg-muted mt-0.5
                    ${large ? "opacity-30 hover:opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <X size={13} />
      </button>
    </Row>
  )
}

// ── Empty / skeleton ───────────────────────────────────────────────────────────
const EmptyState = ({ large = false }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${large ? "py-24" : "py-14"}`}>
    <div className={`rounded-full bg-muted/40 flex items-center justify-center
                     ${large ? "w-16 h-16" : "w-12 h-12"}`}>
      <Bell size={large ? 26 : 20} className="text-muted-foreground/25" />
    </div>
    <p className={`text-muted-foreground/50 font-medium ${large ? "text-sm" : "text-xs"}`}>
      You're all caught up!
    </p>
  </div>
)

const LoadingSkeleton = ({ count = 3, large = false }) => (
  <div className="py-1">
    {[...Array(count)].map((_, i) => (
      <div key={i} className={`flex items-start gap-3 animate-pulse
                               ${large ? "px-5 py-4" : "px-4 py-3"}`}>
        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-muted rounded w-3/4" />
          <div className="h-8 bg-muted/60 rounded w-full" />
          <div className="h-2.5 bg-muted/40 rounded w-1/4" />
        </div>
      </div>
    ))}
  </div>
)

// ── Shared notification content ────────────────────────────────────────────────
const NotifContent = ({ notifications, unreadCount, isLoading, markRead,
  markAllRead, remove, onNavigate, large = false, onClose }) => (
  <>
    <div className={`flex items-center justify-between border-b border-border shrink-0
                     ${large ? "px-5 py-3.5" : "px-4 py-3"}`}>
      <div className="flex items-center gap-2">
        <Bell size={large ? 15 : 12} className="text-muted-foreground" />
        <span className={`font-semibold text-foreground ${large ? "text-base" : "text-sm"}`}>
          Notifications
        </span>
        {unreadCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                           bg-primary text-primary-foreground leading-none">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className={`flex items-center gap-1 font-medium
                       text-muted-foreground hover:text-primary transition-colors
                       ${large ? "text-xs" : "text-[11px]"}`}>
            <CheckCheck size={large ? 13 : 11} />
            Mark all read
          </button>
        )}
        {!large && (
          <button onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center
                       text-muted-foreground hover:text-foreground hover:bg-muted
                       transition-colors ml-1">
            <X size={13} />
          </button>
        )}
      </div>
    </div>

    <style>{`.notif-scroll::-webkit-scrollbar { display: none; }`}</style>
    <div
      className={`notif-scroll divide-y divide-border/30
                  ${large ? "flex-1 overflow-y-auto overscroll-contain" : "max-h-[440px] overflow-y-auto overscroll-contain"}`}
      style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
    >
      {isLoading
        ? <LoadingSkeleton count={large ? 5 : 3} large={large} />
        : notifications.length === 0
          ? <EmptyState large={large} />
          : large
            ? (
              <AnimatePresence initial={false}>
                {notifications.map(notif => (
                  <NotifItem key={notif.$id} notif={notif} large={large}
                    onRead={markRead} onDelete={remove} onNavigate={onNavigate} />
                ))}
              </AnimatePresence>
            )
            : notifications.map(notif => (
              <NotifItem key={notif.$id} notif={notif}
                onRead={markRead} onDelete={remove} onNavigate={onNavigate} />
            ))
      }
    </div>

    {notifications.length > 0 && (
      <div className="border-t border-border/50 flex items-center justify-between px-4 py-2.5 shrink-0">
        <p className="text-[10px] text-muted-foreground/35">
          {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { onClose(); window.location.href = "/dashboard/notifications" }}
          className="text-[11px] text-primary hover:underline font-medium"
        >
          View all →
        </button>
      </div>
    )}
  </>
)

// ── Bell button ────────────────────────────────────────────────────────────────
const BellButton = ({ bellRef, onClick, hasUnread, unreadCount }) => {
  const controls = useAnimation()
  const prevRef = useRef(unreadCount)

  useEffect(() => {
    if (unreadCount > prevRef.current) {
      controls.start({
        rotate: [0, -28, 28, -22, 22, -12, 12, -6, 6, 0],
        transition: { duration: 0.8, ease: "easeInOut" },
      })
    }
    prevRef.current = unreadCount
  }, [unreadCount, controls])

  return (
    <button
      ref={bellRef}
      onClick={onClick}
      className="relative flex items-center justify-center w-9 h-9 rounded-full
                 bg-white/60 dark:bg-white/5
                 hover:bg-white/80 dark:hover:bg-white/10
                 border border-white/20 dark:border-white/5
                 transition-colors duration-150"
      aria-label="Notifications"
    >
      <motion.div animate={controls} style={{ transformOrigin: "50% 20%" }}>
        <Bell size={15} className={`transition-colors duration-300
                                    ${hasUnread ? "text-primary" : "text-foreground/70"}`} />
      </motion.div>
      {hasUnread && (
        <span className="absolute inset-0 rounded-full ring-2 ring-primary/30 pointer-events-none" />
      )}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1
                       rounded-full bg-primary text-primary-foreground
                       text-[9px] font-bold flex items-center justify-center
                       leading-none shadow-sm"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// ── Mobile bottom sheet ────────────────────────────────────────────────────────
const MobileSheet = ({ onClose, contentProps }) => {
  const y = useMotionValue(0)
  const dragControls = useDragControls()
  const backdropOpacity = useTransform(y, [0, 300], [1, 0])
  const borderRadius = useTransform(y, [0, 100], [16, 28])

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed", inset: 0, zIndex: 999998,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          opacity: backdropOpacity,
        }}
        onClick={onClose}
      />
      <motion.div
        drag="y" dragControls={dragControls} dragListener={false}
        dragConstraints={{ top: 0 }} dragElastic={{ top: 0.05, bottom: 0.3 }}
        onDragEnd={handleDragEnd}
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, top: 68,
          zIndex: 999999, y,
          borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
        }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="bg-background border-t border-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={(e) => dragControls.start(e)}>
          <motion.div
            style={{
              width: useTransform(y, [0, 80], [40, 56]),
              opacity: useTransform(y, [0, 120], [0.25, 0.6]),
            }}
            className="h-1 rounded-full bg-muted-foreground"
          />
          <motion.p
            style={{ opacity: useTransform(y, [40, 100], [0, 1]) }}
            className="text-[10px] text-muted-foreground/50 mt-1.5 font-medium"
          >
            Release to close
          </motion.p>
        </div>
        <NotifContent {...contentProps} large />
      </motion.div>
    </>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  const { notifications, unreadCount, isLoading, markRead, markAllRead, remove } =
    useNotifications()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const updatePos = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }

  useEffect(() => {
    if (!open || isMobile) return
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [open, isMobile])

  useEffect(() => {
    if (!open || isMobile) return
    updatePos()
    window.addEventListener("scroll", updatePos, { passive: true })
    window.addEventListener("resize", updatePos)
    return () => {
      window.removeEventListener("scroll", updatePos)
      window.removeEventListener("resize", updatePos)
    }
  }, [open, isMobile])

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    if (open) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [open])

  const handleOpen = () => setOpen(v => !v)
  const close = () => setOpen(false)

  const handleNavigate = (notif) => {
    close()

    if (notif.type === "ban" || notif.type === "ban_lifted") {
      window.location.href = "/dashboard/notifications"
      return
    }

    if (notif.type === "task") {
      window.location.href = "/dashboard/tasks"
      return
    }

    if (notif.type === "follow") {
      if (notif.actorUsername) window.location.href = `/profile/${notif.actorUsername}`
      return
    }

    // ── ADD HERE — before the threadId guard ──
    if (notif.type === "attendance") {
      window.location.href = "/dashboard/attendance"
      return
    }

    if (!notif.threadId) return   // ← now attendance never hits this

    if (notif.type === "reply" && notif.message?.includes("thread")) {
      window.location.href = notif.replyId
        ? `/forum/${notif.threadId}#reply-${notif.replyId}`
        : `/forum/${notif.threadId}`
      return
    }

    if (notif.type === "reply" && notif.message?.includes("comment")) {
      window.location.href = notif.replyId
        ? `/forum/${notif.threadId}?focus=${notif.replyId}`
        : `/forum/${notif.threadId}`
      return
    }

    if (notif.type === "mention") {
      window.location.href = notif.replyId
        ? `/forum/${notif.threadId}#reply-${notif.replyId}`
        : `/forum/${notif.threadId}`
      return
    }

    window.location.href = `/forum/${notif.threadId}`
  }

  const contentProps = {
    notifications, unreadCount, isLoading,
    markRead, markAllRead, remove,
    onNavigate: handleNavigate,
    onClose: close,
  }

  return (
    <>
      <BellButton
        bellRef={triggerRef}
        onClick={handleOpen}
        hasUnread={unreadCount > 0}
        unreadCount={unreadCount}
      />

      {open && createPortal(
        <AnimatePresence>
          {!isMobile && pos && (
            <motion.div
              key="desktop-dropdown"
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.97, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ duration: 0.13 }}
              style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 999999 }}
              className="w-[320px] rounded-2xl border border-border bg-background
                         shadow-[0_24px_64px_rgba(0,0,0,0.35)] overflow-hidden
                         flex flex-col origin-top-right"
            >
              <NotifContent {...contentProps} />
            </motion.div>
          )}

          {isMobile && (
            <MobileSheet key="mobile-sheet" onClose={close} contentProps={contentProps} />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
