import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  fetchContactMessages,
  updateMessageStatus,
  updateMessage
} from "@/services/admin/contactMessagesService"
import {
  Mail,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  Save
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", icon: Mail },
  seen: { label: "Seen", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400", icon: Eye },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400", icon: CheckCircle2 }
}

export default function AdminContactMessages() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)
  const [adminNote, setAdminNote] = useState("")

  // Load messages
  useEffect(() => {
    loadMessages()
  }, [])

  // Sync admin note when message changes
  useEffect(() => {
    if (selectedMessage) {
      setAdminNote(selectedMessage.admin_note || "")
    }
  }, [selectedMessage])

  async function loadMessages() {
    setLoading(true)
    setError("")
    try {
      const data = await fetchContactMessages()
      setMessages(data)
      
      // Auto-select first message if none selected
      if (!selectedMessage && data.length > 0) {
        setSelectedMessage(data[0])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(messageId, newStatus) {
    setUpdating(true)
    try {
      await updateMessageStatus(messageId, newStatus)
      
      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.$id === messageId ? { ...msg, status: newStatus } : msg
        )
      )
      
      if (selectedMessage?.$id === messageId) {
        setSelectedMessage(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleSaveNote() {
    if (!selectedMessage) return
    
    setUpdating(true)
    try {
      await updateMessage(selectedMessage.$id, {
        admin_note: adminNote.trim() || null,
        handled_by: currentUser?.username || currentUser?.email || null
      })
      
      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.$id === selectedMessage.$id
            ? { ...msg, admin_note: adminNote.trim() || null }
            : msg
        )
      )
      
      setSelectedMessage(prev => ({ ...prev, admin_note: adminNote.trim() || null }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const newCount = messages.filter(m => m.status === "new").length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {messages.length} total messages
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                {newCount} new
              </span>
            )}
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/40 p-12 text-center">
          <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-1">No messages yet</h3>
          <p className="text-sm text-muted-foreground">
            Contact form submissions will appear here
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[380px_1fr] gap-4">
          {/* Message List */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
              {messages.map((msg) => {
                const StatusIcon = STATUS_CONFIG[msg.status]?.icon || Mail
                const isSelected = selectedMessage?.$id === msg.$id
                const isNew = msg.status === "new"

                return (
                  <button
                    key={msg.$id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-4 border-b border-border transition-colors
                      ${isSelected
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                      }
                      ${isNew ? "bg-blue-50/50 dark:bg-blue-500/5" : ""}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={`font-semibold text-sm truncate ${isNew ? "text-blue-700 dark:text-blue-400" : ""}`}>
                        {msg.name}
                      </p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${STATUS_CONFIG[msg.status]?.color || "bg-muted text-muted-foreground"}`}>
                        {STATUS_CONFIG[msg.status]?.label || msg.status}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {msg.email}
                    </p>
                    
                    <p className="text-xs text-foreground/80 line-clamp-2 mb-2">
                      {msg.message}
                    </p>
                    
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(msg.$createdAt), { addSuffix: true })}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message Detail */}
          {selectedMessage ? (
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedMessage.name}</h2>
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                    
                    <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${STATUS_CONFIG[selectedMessage.status]?.color || "bg-muted text-muted-foreground"}`}>
                      {STATUS_CONFIG[selectedMessage.status]?.label || selectedMessage.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(selectedMessage.$createdAt).toLocaleString()}
                    </div>
                    {selectedMessage.source && (
                      <span className="px-2 py-0.5 rounded bg-muted">
                        {selectedMessage.source}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Message</h3>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Status Actions */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                      const Icon = config.icon
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedMessage.$id, status)}
                          disabled={updating || selectedMessage.status === status}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                            ${selectedMessage.status === status
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-background border border-border hover:bg-muted"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Icon size={13} />
                          Mark as {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Admin Note */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Admin Note (Internal)</h3>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add internal notes about this message..."
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                      outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={updating || adminNote === (selectedMessage.admin_note || "")}
                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                      hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Note
                      </>
                    )}
                  </button>
                </div>

                {/* Metadata */}
                {(selectedMessage.user_agent || selectedMessage.handled_by) && (
                  <div className="pt-4 border-t border-border space-y-2">
                    {selectedMessage.user_agent && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">User Agent</p>
                        <p className="text-xs text-foreground/70 break-all">
                          {selectedMessage.user_agent}
                        </p>
                      </div>
                    )}
                    {selectedMessage.handled_by && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Handled By</p>
                        <p className="text-xs text-foreground/70">
                          {selectedMessage.handled_by}
                          {selectedMessage.handled_at && (
                            <span className="ml-2 text-muted-foreground">
                              • {new Date(selectedMessage.handled_at).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/40 p-12 text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Select a message to view details
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}