// src/pages/admin/moderation/AdminModeration.jsx
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Flag, ShieldX, ShieldCheck, Clock, CheckCircle2,
  XCircle, Loader2, ExternalLink,
  Search, RefreshCw, Ban, User, MessageSquare, Trash2, Link2, AlertTriangle,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { PERMISSIONS } from "@/config/permissions"
import {
  listReports,
  resolveReport,
  getPendingReportCount,
  deleteReport,
  bulkDeleteReports,
} from "@/services/moderation/reportService"
import {
  listBans,
  banUser,
  liftBan,
  deleteBan,
} from "@/services/moderation/banService"
import { databases, Query } from "@/lib/appwrite"
import { deleteReply } from "@/services/forum/replyService"

// ── Helpers ───────────────────────────────────────────────────────────────────

const TAB = { REPORTS: "reports", BANS: "bans" }

const STATUS_STYLE = {
  pending:   "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  resolved:  "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
}

const STATUS_ICON = {
  pending:   <Clock size={11} />,
  resolved:  <CheckCircle2 size={11} />,
  dismissed: <XCircle size={11} />,
}

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_ICON[status]} {status}
    </span>
  )
}

function BanTypeBadge({ banType, isActive }) {
  if (!isActive) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-muted text-muted-foreground border-border">
      <ShieldCheck size={11} /> lifted
    </span>
  )
  return banType === "permanent"
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"><ShieldX size={11}/> permanent</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"><Clock size={11}/> temporary</span>
}

function fmtDate(iso) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function extractPath(url) {
  if (!url) return "-"
  try {
    const { pathname, search } = new URL(url)
    return pathname + search
  } catch {
    return url
  }
}

// ── Shared modal backdrop + card ──────────────────────────────────────────────

function ModalShell({ children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"} rounded-2xl bg-background border border-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  )
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, description, loading }) {
  if (!isOpen) return null
  return (
    <ModalShell>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
          <AlertTriangle size={15} className="text-red-500" />
        </div>
        <span className="font-semibold text-foreground text-sm">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2 rounded-lg border border-border text-muted-foreground
                     hover:text-foreground hover:bg-muted text-sm transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50
                     text-white text-sm font-medium transition flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Delete
        </button>
      </div>
    </ModalShell>
  )
}

// ── Ban Issue Modal ───────────────────────────────────────────────────────────

function BanModal({ isOpen, onClose, onBan, target, canPermanent }) {
  const [banType, setBanType] = useState("temporary")
  const [days,    setDays]    = useState(7)
  const [reason,  setReason]  = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  if (!isOpen) return null

  const handleBan = async () => {
    if (!reason.trim()) { setError("Reason is required."); return }
    if (banType === "temporary" && (!days || days < 1)) { setError("Days must be ≥ 1."); return }
    setLoading(true); setError("")
    try {
      const expiresAt = banType === "temporary"
        ? new Date(Date.now() + days * 86_400_000).toISOString()
        : null
      await onBan({ ...target, reason: reason.trim(), banType, expiresAt })
      onClose()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <ModalShell>
      <div className="flex items-center gap-2 mb-5">
        <ShieldX size={16} className="text-red-500" />
        <span className="font-semibold text-foreground text-sm">Ban @{target?.username}</span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Ban Type</p>
          <div className="flex gap-2">
            {["temporary", ...(canPermanent ? ["permanent"] : [])].map(t => (
              <button
                key={t}
                onClick={() => setBanType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                  banType === t
                    ? t === "permanent"
                      ? "bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400"
                      : "bg-orange-500/15 border-orange-500/40 text-orange-600 dark:text-orange-400"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {t === "temporary" ? "⏱ Temporary" : "🔴 Permanent"}
              </button>
            ))}
          </div>
        </div>

        {banType === "temporary" && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Duration (days)</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 3, 7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                    days === d
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >{d}d</button>
              ))}
              <input
                type="number" min={1} max={365}
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-16 rounded-lg bg-muted border border-border px-2 py-1.5 text-xs
                           text-foreground focus:outline-none focus:border-primary/50 text-center"
              />
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Reason (shown to user)</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this user is being banned..."
            maxLength={400}
            rows={3}
            className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm
                       text-foreground placeholder:text-muted-foreground/60 resize-none
                       focus:outline-none focus:border-primary/50 transition"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-muted-foreground
                       hover:text-foreground hover:bg-muted text-sm transition">
            Cancel
          </button>
          <button onClick={handleBan} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50
                       text-white text-sm font-medium transition flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Issue Ban
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ── Resolve Modal ─────────────────────────────────────────────────────────────

function ResolveModal({ isOpen, onClose, report, onResolve }) {
  const [resolution,    setResolution]   = useState("")
  const [loading,       setLoading]      = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showBanModal,  setShowBanModal] = useState(false)
  const { currentUser, hasPermission }   = useAuth()
  const canBan       = hasPermission(PERMISSIONS.BAN_USER)
  const canPermanent = hasPermission(PERMISSIONS.PERMANENT_BAN_USER)

  if (!isOpen || !report) return null

  const isBrokenLink = report.targetType === "broken_link"
  const brokenPath   = isBrokenLink ? extractPath(report.contentPreview) : null

  const handleResolve = async (shouldDismiss = false) => {
    setLoading(true)
    try {
      await onResolve({ reportId: report.$id, resolution: resolution.trim() || null, dismiss: shouldDismiss })
      onClose()
    } catch { /* handled by parent */ }
    finally { setLoading(false) }
  }

  const handleDeleteContent = async () => {
    if (report.targetType !== "reply" || !report.targetId) return
    setDeleteLoading(true)
    try {
      await deleteReply(report.targetId, true)
      await onResolve({
        reportId: report.$id,
        resolution: (resolution.trim() || "Content removed by moderator."),
        dismiss: false,
      })
      onClose()
    } catch (e) {
      console.error("Delete content failed", e)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <ModalShell wide>
        <div className="flex items-center gap-2 mb-5">
          <Flag size={16} className="text-amber-500" />
          <span className="font-semibold text-foreground text-sm">Review Report</span>
        </div>

        {/* Report summary */}
        <div className="rounded-xl bg-muted/60 border border-border p-4 space-y-2 mb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              {isBrokenLink
                ? <><Link2 size={12} className="text-blue-400" /> Broken Link</>
                : <span className="capitalize">{report.targetType}</span>
              }
            </span>
            <span>•</span>
            {isBrokenLink
              ? <span>reported by @{report.reporterUsername}</span>
              : <>
                  <span>@{report.targetAuthorUsername}</span>
                  <span>•</span>
                  <span>Reported by @{report.reporterUsername}</span>
                </>
            }
          </div>

          <p className="text-sm font-medium text-foreground">{report.reason}</p>
          {report.details && <p className="text-xs text-muted-foreground">{report.details}</p>}

          {isBrokenLink && report.contentPreview ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Route:</span>
                <code className="px-2 py-0.5 rounded-md bg-background border border-border
                                 text-blue-400 text-xs font-mono tracking-tight break-all">
                  {brokenPath}
                </code>
              </div>
              <a
                href={report.contentPreview}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground
                           hover:text-blue-400 hover:underline transition break-all"
              >
                <ExternalLink size={11} className="shrink-0" />
                Verify in browser
              </a>
            </div>
          ) : report.contentPreview && (
            <div className="rounded-lg bg-background border border-border px-3 py-2 text-xs text-muted-foreground line-clamp-3">
              {report.contentPreview}
            </div>
          )}

          {report.threadId && (
            <Link
              to={`/forum/${report.threadId}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink size={11} /> View in forum
            </Link>
          )}
        </div>

        {/* Resolution note */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Resolution Note (optional)</p>
          <textarea
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            placeholder={isBrokenLink ? "e.g. Route removed, redirect added, or will fix..." : "Internal note about action taken..."}
            rows={2}
            className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm
                       text-foreground placeholder:text-muted-foreground/60 resize-none
                       focus:outline-none focus:border-primary/50 transition"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canBan && !isBrokenLink && (
            <button
              onClick={() => setShowBanModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30
                         text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/20 transition"
            >
              <ShieldX size={13} /> Ban User
            </button>
          )}

          {report.targetType === "reply" && report.targetId && (
            <button
              onClick={handleDeleteContent}
              disabled={deleteLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30
                         text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-50"
            >
              {deleteLoading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete Content
            </button>
          )}

          <button
            onClick={() => handleResolve(false)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30
                       text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-500/20 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Mark Resolved
          </button>
          <button
            onClick={() => handleResolve(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted border border-border
                       text-muted-foreground text-xs font-medium hover:bg-muted/80 hover:text-foreground transition disabled:opacity-50"
          >
            <XCircle size={13} /> Dismiss
          </button>
          <button onClick={onClose}
            className="ml-auto px-3 py-2 rounded-lg border border-border text-muted-foreground
                       text-xs hover:text-foreground hover:bg-muted transition">
            Close
          </button>
        </div>
      </ModalShell>

      <BanModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        canPermanent={canPermanent}
        target={{
          userId:   report.targetAuthorId,
          username: report.targetAuthorUsername,
          reportId: report.$id,
        }}
        onBan={async ({ userId, username, reason, banType, expiresAt, reportId }) => {
          await banUser({
            userId, username, reason, banType, expiresAt, reportId,
            bannedBy: currentUser.$id,
            bannedByUsername: currentUser.username,
          })
          await onResolve({
            reportId: report.$id,
            resolution: `Banned: ${reason}`,
            dismiss: false,
          })
          setShowBanModal(false)
          onClose()
        }}
      />
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminModeration() {
  const { currentUser, hasPermission } = useAuth()
  const qc = useQueryClient()

  const canResolve    = hasPermission(PERMISSIONS.RESOLVE_REPORTS)
  const canBan        = hasPermission(PERMISSIONS.BAN_USER)
  const canUnban      = hasPermission(PERMISSIONS.UNBAN_USER)
  const canPermanent  = hasPermission(PERMISSIONS.PERMANENT_BAN_USER)
  const canDelete     = hasPermission(PERMISSIONS.DELETE_REPORTS)
  const canBulkDelete = hasPermission(PERMISSIONS.BULK_DELETE_REPORTS)

  const [tab,            setTab]           = useState(TAB.REPORTS)
  const [reportStatus,   setReportStatus]  = useState("pending")
  const [banActiveOnly,  setBanActiveOnly]  = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [banTarget,      setBanTarget]      = useState(null)
  const [search,         setSearch]         = useState("")

  // ── Delete state ──────────────────────────────────────────────────────────
   const [deleteTarget,    setDeleteTarget]   = useState(null)   // single report doc
  const [deleteBanTarget, setDeleteBanTarget] = useState(null)  // single ban doc
  const [showBulkModal,   setShowBulkModal]  = useState(false)
  const [bulkDeleting,    setBulkDeleting]   = useState(false)

  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ["admin-reports", reportStatus],
    queryFn:  () => listReports({ status: reportStatus }),
    staleTime: 30_000,
  })

  const { data: bansData, isLoading: bansLoading, refetch: refetchBans } = useQuery({
    queryKey: ["admin-bans", banActiveOnly],
    queryFn:  () => listBans({ activeOnly: banActiveOnly }),
    staleTime: 30_000,
  })

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-reports-pending-count"],
    queryFn:  getPendingReportCount,
    staleTime: 60_000,
  })

  const resolveMut = useMutation({
    mutationFn: ({ reportId, resolution, dismiss }) =>
      resolveReport({ reportId, resolvedBy: currentUser.$id, resolution, dismiss }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] })
      qc.invalidateQueries({ queryKey: ["admin-reports-pending-count"] })
    },
  })

  // Single report delete mutation
  const deleteMut = useMutation({
    mutationFn: (reportId) => deleteReport(reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] })
      qc.invalidateQueries({ queryKey: ["admin-reports-pending-count"] })
      setDeleteTarget(null)
    },
  })

   const liftMut = useMutation({
    mutationFn: (userId) => liftBan({ userId, liftedBy: currentUser.$id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bans"] }),
  })

  const deleteBanMut = useMutation({
    mutationFn: (banId) => deleteBan(banId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bans"] })
      setDeleteBanTarget(null)
    },
  })

  const reports = reportsData?.reports ?? []
  const bans    = bansData?.bans ?? []

  const filteredReports = reports.filter(r =>
    !search ||
    r.targetAuthorUsername?.toLowerCase().includes(search.toLowerCase()) ||
    r.reporterUsername?.toLowerCase().includes(search.toLowerCase()) ||
    r.reason?.toLowerCase().includes(search.toLowerCase()) ||
    (r.targetType === "broken_link" && extractPath(r.contentPreview)?.toLowerCase().includes(search.toLowerCase()))
  )

  const filteredBans = bans.filter(b =>
    !search || b.username?.toLowerCase().includes(search.toLowerCase())
  )

  // Bulk delete: only resolved + dismissed reports are eligible
  const bulkEligibleCount = reports.filter(r =>
    r.status === "resolved" || r.status === "dismissed"
  ).length

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      const ids = reports
        .filter(r => r.status === "resolved" || r.status === "dismissed")
        .map(r => r.$id)
      await bulkDeleteReports(ids)
      qc.invalidateQueries({ queryKey: ["admin-reports"] })
      qc.invalidateQueries({ queryKey: ["admin-reports-pending-count"] })
      setShowBulkModal(false)
    } catch (e) {
      console.error("Bulk delete failed", e)
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600
                        flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
          <ShieldX size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Moderation</h1>
          <p className="text-xs text-muted-foreground">Reports, bans & community safety</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
        {[
          { key: TAB.REPORTS, icon: Flag, label: "Reports", badge: pendingCount },
          { key: TAB.BANS,    icon: Ban,  label: "Bans",    badge: 0 },
        ].map(({ key, icon: Icon, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} />
            {label}
            {badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === TAB.REPORTS ? "Search by user, reason, or route..." : "Search by username..."}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-border text-sm
                       text-foreground placeholder:text-muted-foreground/60
                       focus:outline-none focus:border-primary/50 transition"
          />
        </div>

        {tab === TAB.REPORTS && (
          <div className="flex gap-1.5">
            {["pending", "resolved", "dismissed"].map(s => (
              <button
                key={s}
                onClick={() => setReportStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition capitalize ${
                  reportStatus === s
                    ? STATUS_STYLE[s]
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >{s}</button>
            ))}
          </div>
        )}

        {tab === TAB.BANS && (
          <div className="flex gap-1.5">
            {[
              { label: "Active",      active: banActiveOnly,  onClick: () => setBanActiveOnly(true),  activeClass: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" },
              { label: "All History", active: !banActiveOnly, onClick: () => setBanActiveOnly(false), activeClass: "bg-primary/10 border-primary/30 text-primary" },
            ].map(({ label, active, onClick, activeClass }) => (
              <button key={label} onClick={onClick}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  active ? activeClass : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >{label}</button>
            ))}
          </div>
        )}

        <button
          onClick={() => tab === TAB.REPORTS ? refetchReports() : refetchBans()}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          <RefreshCw size={14} />
        </button>

        {/* Bulk clear - owner only, only shown on resolved/dismissed tabs */}
        {tab === TAB.REPORTS && canBulkDelete && (reportStatus === "resolved" || reportStatus === "dismissed") && reports.length > 0 && (
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30
                       text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/20 transition"
          >
            <Trash2 size={13} /> Clear All {reportStatus} ({reports.length})
          </button>
        )}

        {tab === TAB.BANS && canBan && (
          <button
            onClick={() => setBanTarget({ userId: "", username: "" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700
                       text-white text-xs font-medium transition"
          >
            <Ban size={13} /> Ban User
          </button>
        )}
      </div>

      {/* ── REPORTS TAB ──────────────────────────────────────────────────────── */}
      {tab === TAB.REPORTS && (
        <div className="space-y-3">
          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No {reportStatus} reports
            </div>
          ) : filteredReports.map(report => {
            const isBrokenLink = report.targetType === "broken_link"
            const brokenPath   = isBrokenLink ? extractPath(report.contentPreview) : null

            return (
              <div key={report.$id}
                className="rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition">

                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge status={report.status} />

                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {report.targetType === "reply"       && <MessageSquare size={11} />}
                        {report.targetType === "user"        && <User size={11} />}
                        {isBrokenLink                        && <Link2 size={11} className="text-blue-400" />}
                        <span className={isBrokenLink ? "text-blue-400 font-medium" : "capitalize"}>
                          {isBrokenLink ? "Broken Link" : report.targetType}
                        </span>
                      </span>

                      <span className="text-xs text-muted-foreground">{fmtDate(report.$createdAt)}</span>
                    </div>

                    <p className="text-sm font-medium text-foreground">{report.reason}</p>
                    {report.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{report.details}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Delete single report */}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(report)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500
                                   hover:bg-red-500/10 border border-transparent hover:border-red-500/20
                                   transition"
                        title="Delete report"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    {report.status === "pending" && canResolve && (
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30
                                   text-primary text-xs font-medium hover:bg-primary/20 transition"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  {!isBrokenLink && (
                    <span>
                      <span className="opacity-60">Reported:</span>{" "}
                      <span className="text-foreground font-medium">@{report.targetAuthorUsername}</span>
                    </span>
                  )}
                  <span>
                    <span className="opacity-60">By:</span>{" "}
                    <span className="text-foreground">
                      {isBrokenLink && report.reporterUsername === "anonymous"
                        ? "anonymous"
                        : `@${report.reporterUsername}`}
                    </span>
                  </span>
                  {report.resolvedBy && (
                    <span>
                      <span className="opacity-60">Resolved:</span>{" "}
                      <span className="text-foreground">{fmtDate(report.resolvedAt)}</span>
                    </span>
                  )}
                </div>

                {isBrokenLink && brokenPath ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted border border-border px-3 py-2">
                    <Link2 size={12} className="text-blue-400 shrink-0" />
                    <code className="text-xs text-blue-400 font-mono break-all">{brokenPath}</code>
                    <a
                      href={report.contentPreview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto shrink-0 text-muted-foreground hover:text-blue-400 transition"
                      title="Open in browser"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : report.contentPreview ? (
                  <div className="mt-3 rounded-lg bg-muted border border-border px-3 py-2 text-xs text-muted-foreground line-clamp-2">
                    {report.contentPreview}
                  </div>
                ) : null}

                {report.resolution && (
                  <div className="mt-2 text-xs text-muted-foreground italic">
                    Note: {report.resolution}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── BANS TAB ─────────────────────────────────────────────────────────── */}
      {tab === TAB.BANS && (
        <div className="space-y-3">
          {bansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : filteredBans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No {banActiveOnly ? "active" : ""} bans
            </div>
          ) : filteredBans.map(ban => (
            <div key={ban.$id}
              className="rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition">

              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <BanTypeBadge banType={ban.banType} isActive={ban.isActive} />
                    <span className="font-semibold text-foreground">@{ban.username}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(ban.$createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{ban.reason}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                    <span><span className="opacity-60">By:</span> @{ban.bannedByUsername}</span>
                    {ban.banType === "temporary" && ban.expiresAt && (
                      <span><span className="opacity-60">Expires:</span> {fmtDate(ban.expiresAt)}</span>
                    )}
                    {!ban.isActive && ban.liftedAt && (
                      <span><span className="opacity-60">Lifted:</span> {fmtDate(ban.liftedAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canDelete && ban.isActive !== true && (
                    <button
                      onClick={() => setDeleteBanTarget(ban)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500
                                 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                      title="Delete ban record"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {ban.isActive && canUnban && (
                    <button
                      onClick={() => liftMut.mutate(ban.userId)}
                      disabled={liftMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                 bg-green-500/10 border border-green-500/30
                                 text-green-600 dark:text-green-400
                                 text-xs font-medium hover:bg-green-500/20 transition disabled:opacity-50"
                    >
                      {liftMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={13} />}
                      Lift Ban
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <ResolveModal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
        onResolve={({ reportId, resolution, dismiss }) =>
          resolveMut.mutateAsync({ reportId, resolution, dismiss })
        }
      />

      {/* Single delete confirm */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
        title="Delete Report"
        description={
          deleteTarget
            ? `Permanently delete this "${deleteTarget.reason}" report from the database? This cannot be undone.`
            : ""
        }
        onConfirm={() => deleteMut.mutate(deleteTarget.$id)}
      />

      {/* Bulk delete confirm */}
      <ConfirmDeleteModal
        isOpen={!!deleteBanTarget}
        onClose={() => setDeleteBanTarget(null)}
        loading={deleteBanMut.isPending}
        title="Delete Ban Record"
        description={
          deleteBanTarget
            ? `Permanently delete the ban record for @${deleteBanTarget.username}? This removes it from history but does not affect any active ban.`
            : ""
        }
        onConfirm={() => deleteBanMut.mutate(deleteBanTarget.$id)}
      />

      <BanUserSearchModal
        isOpen={!!banTarget && !banTarget.userId}
        onClose={() => setBanTarget(null)}
        canPermanent={canPermanent}
        bannedBy={currentUser.$id}
        bannedByUsername={currentUser.username}
        onSuccess={() => {
          setBanTarget(null)
          qc.invalidateQueries({ queryKey: ["admin-bans"] })
        }}
      />
    </div>
  )
}

// ── Standalone Ban-by-Search Modal ────────────────────────────────────────────

function BanUserSearchModal({ isOpen, onClose, canPermanent, bannedBy, bannedByUsername, onSuccess }) {
  const [query,     setQuery]     = useState("")
  const [results,   setResults]   = useState([])
  const [picked,    setPicked]    = useState(null)
  const [searching, setSearching] = useState(false)
  const [showBan,   setShowBan]   = useState(false)

  if (!isOpen) return null

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        [Query.startsWith("username", query.trim()), Query.limit(5)]
      )
      setResults(res.documents)
    } catch { setResults([]) }
    finally { setSearching(false) }
  }

  const handleClose = () => {
    setQuery(""); setResults([]); setPicked(null); setShowBan(false); onClose()
  }

  return (
    <>
      <ModalShell>
        <div className="flex items-center gap-2 mb-5">
          <Ban size={16} className="text-red-500" />
          <span className="font-semibold text-foreground text-sm">Ban a User</span>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search username..."
            className="flex-1 rounded-lg bg-muted border border-border px-3 py-2 text-sm
                       text-foreground placeholder:text-muted-foreground/60
                       focus:outline-none focus:border-primary/50 transition"
          />
          <button onClick={search} disabled={searching}
            className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs transition disabled:opacity-50">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </div>

        <div className="space-y-1.5 mb-4">
          {results.map(u => (
            <button key={u.$id}
              onClick={() => { setPicked(u); setShowBan(true) }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                          border transition ${
                            picked?.$id === u.$id
                              ? "border-primary/40 bg-primary/10"
                              : "border-border hover:bg-muted"
                          }`}
            >
              {u.avatarUrl
                ? <img src={u.avatarUrl} className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                                  flex items-center justify-center text-xs font-bold text-white">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
              }
              <div>
                <p className="text-sm font-medium text-foreground">@{u.username}</p>
                <p className="text-xs text-muted-foreground">{u.name}</p>
              </div>
            </button>
          ))}
        </div>

        <button onClick={handleClose}
          className="w-full py-2 rounded-lg border border-border text-muted-foreground
                     hover:text-foreground hover:bg-muted text-sm transition">
          Cancel
        </button>
      </ModalShell>

      <BanModal
        isOpen={showBan && !!picked}
        onClose={() => { setShowBan(false); setPicked(null) }}
        canPermanent={canPermanent}
        target={{ userId: picked?.userId, username: picked?.username }}
        onBan={async ({ userId, username, reason, banType, expiresAt }) => {
          await banUser({ userId, username, reason, banType, expiresAt, bannedBy, bannedByUsername })
          handleClose()
          onSuccess()
        }}
      />
    </>
  )
}