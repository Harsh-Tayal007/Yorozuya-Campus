// src/pages/dashboard/NotificationsPage.jsx
import { useNavigate } from "react-router-dom"
import { Bell, ShieldX, Check, CheckCheck, Trash2 } from "lucide-react"
import useNotifications from "@/hooks/useNotifications"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_COL = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

const TYPE_CONFIG = {
    reply: { color: "bg-blue-500", label: "Reply" },
    mention: { color: "bg-purple-500", label: "Mention" },
    follow: { color: "bg-green-500", label: "Follow" },
    ban: { color: "bg-red-500", label: "Ban" },
    ban_lifted: { color: "bg-green-500", label: "Ban Lifted" },
    task: { color: "bg-amber-500", label: "Task" },
    attendance: { color: "bg-emerald-500", label: "Attendance" },
}

const stripHtml = (html = "") =>
    html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

function fmtDate(iso) {
    const d = new Date(iso)
    const diff = (Date.now() - d) / 1000
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

export default function NotificationsPage() {
    const navigate = useNavigate()
    const { notifications, unreadCount, isLoading, markRead, markAllRead, remove } = useNotifications()

    const handleClick = async (notif) => {
        if (!notif.read) markRead(notif.$id)

        if (notif.type === "ban" || notif.type === "ban_lifted") return

        if (notif.type === "follow") {
            // Resolve current username from actorId — immune to username changes
            if (notif.actorId) {
                try {
                    const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
                        Query.equal("userId", notif.actorId),
                        Query.select(["username"]),
                        Query.limit(1),
                    ])
                    const username = res.documents[0]?.username
                    if (username) { navigate(`/profile/${username}`); return }
                } catch { /* fall through to actorUsername fallback */ }
            }
            // Fallback: use stored actorUsername if live lookup fails
            if (notif.actorUsername) navigate(`/profile/${notif.actorUsername}`)
            return
        }

        if (notif.type === "attendance") {
            navigate("/dashboard/attendance")
            return
        }

        if (notif.threadId) {
            navigate(
                notif.replyId
                    ? `/forum/${notif.threadId}#reply-${notif.replyId}`
                    : `/forum/${notif.threadId}`
            )
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground px-4 py-8 max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                          flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <Bell size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-xs text-slate-400">{unreadCount} unread</p>
                        )}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
           bg-muted border border-border text-muted-foreground hover:text-foreground transition"
                    >
                        <CheckCheck size={13} /> Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="text-center py-16 text-slate-500">Loading…</div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                    <Bell size={32} className="mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(notif => {
                        const cfg = TYPE_CONFIG[notif.type] ?? { color: "bg-slate-500", label: notif.type }
                        const isBan = notif.type === "ban" || notif.type === "ban_lifted"

                        return (
                            <div
                                key={notif.$id}
                                className={`group relative rounded-xl border transition cursor-pointer
  ${notif.read
                                        ? "border-border bg-background hover:bg-muted/50"
                                        : "border-primary/20 bg-primary/5 hover:bg-primary/8"
                                    } ${isBan ? "!border-red-500/20" : ""}`}
                                onClick={() => handleClick(notif)}
                            >
                                <div className="flex items-start gap-3 p-4">
                                    {/* Dot / Avatar */}
                                    <div className="relative shrink-0 mt-0.5">
                                        {notif.actorAvatar
                                            ? <img src={notif.actorAvatar} className="w-9 h-9 rounded-full object-cover" />
                                            : (
                                                <div className={`w-9 h-9 rounded-full ${cfg.color} flex items-center justify-center`}>
                                                    {isBan
                                                        ? <ShieldX size={16} className="text-white" />
                                                        : (notif.actorName
                                                            ? <span className="text-sm font-bold text-white">{notif.actorName.charAt(0).toUpperCase()}</span>
                                                            : <Bell size={16} className="text-white" />)
                                                    }
                                                </div>
                                            )
                                        }
                                        {!notif.read && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.color} bg-opacity-20 text-white dark:text-white`}>
                                                {cfg.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground/60">{fmtDate(notif.$createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-foreground mt-1 leading-snug">
                                            {notif.type === "task" ? (
                                                notif.title || "Task Reminder"
                                            ) : (
                                                <>
                                                    <span className="font-semibold">{notif.actorName}</span>{" "}
                                                    {notif.message}
                                                </>
                                            )}
                                        </p>
                                        {(notif.type === "reply" || notif.type === "mention") && notif.replyContent && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                                                "{stripHtml(notif.replyContent)}"
                                            </p>
                                        )}
                                        {notif.type === "task" && notif.message && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                {notif.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                        {!notif.read && (
                                            <button
                                                onClick={e => { e.stopPropagation(); markRead(notif.$id) }}
                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-green-500 transition"
                                                title="Mark read"
                                            >
                                                <Check size={13} />
                                            </button>
                                        )}
                                        <button
                                            onClick={e => { e.stopPropagation(); remove(notif.$id) }}
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500 transition"
                                            title="Delete"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Ban warning stripe */}
                                {notif.type === "ban" && (
                                    <div className="mx-4 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                                        You cannot post or reply while banned. Contact{" "}
                                        <a href="mailto:support@unizuya.in" className="underline" onClick={e => e.stopPropagation()}>
                                            support@unizuya.in
                                        </a>{" "}
                                        to appeal.
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
