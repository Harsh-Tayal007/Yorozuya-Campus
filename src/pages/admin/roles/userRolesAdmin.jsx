// src/pages/admin/roles/userRolesAdmin.jsx
import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Users, Search, Shield, Star, Pencil as PencilIcon, User as UserIcon, X } from "lucide-react"

import { getUsers, updateUserRole } from "@/services/user/userService"
import { useAuth } from "@/context/AuthContext"
import { ROLES } from "@/config/roles"
import { CustomSelect, GlassCard } from "@/components/admin/CustomSelect"

const ROLE_CONFIG = {
  admin:     { label: "Admin",     color: "#ef4444", bg: "bg-red-500/10",     text: "text-red-500",     icon: Shield },
  moderator: { label: "Moderator", color: "#8b5cf6", bg: "bg-violet-500/10",  text: "text-violet-500",  icon: Star },
  editor:    { label: "Editor",    color: "#3b82f6", bg: "bg-blue-500/10",    text: "text-blue-500",    icon: PencilIcon },
  user:      { label: "User",      color: "#6b7280", bg: "bg-muted",          text: "text-muted-foreground", icon: UserIcon },
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      <Icon size={9} />{cfg.label}
    </span>
  )
}

export default function UserRolesAdmin() {
  const { user, role } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getUsers,
    staleTime: 1000 * 60 * 2,
  })

  const filtered = useMemo(() =>
    users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) ||
                      u.email?.toLowerCase().includes(search.toLowerCase())),
    [users, search])

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.$id === user.$id) {
      toast.error("You cannot change your own role")
      return
    }
    const adminCount = users.filter(u => u.role === "admin").length
    if (targetUser.role === "admin" && newRole !== "admin" && adminCount === 1) {
      toast.error("There must always be at least one admin")
      return
    }
    try {
      await updateUserRole(targetUser.$id, newRole,
        { $id: user.$id, username: user.username, role },
        { username: targetUser.username, oldRole: targetUser.role })
      toast.success(`${targetUser.username} is now ${newRole}`)
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (err) {
      toast.error(err?.message || "Failed to update role")
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
          <Users size={18} className="text-pink-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">User Roles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage roles and permissions for platform users</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username or email…"
          className="w-full h-9 pl-8 pr-8 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm
                     text-sm text-foreground placeholder:text-muted-foreground/50
                     focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                     hover:border-border transition-all duration-150" />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={12} />
          </button>
        )}
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3">
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const count = users.filter(u => u.role === key).length
          const Icon = cfg.icon
          return (
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60
                                       bg-card/60 backdrop-blur-sm">
              <div className={`w-6 h-6 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                <Icon size={11} style={{ color: cfg.color }} />
              </div>
              <span className="text-xs font-medium text-foreground">{count}</span>
              <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
            </div>
          )
        })}
      </motion.div>

      {/* User list */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-16 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <Users size={20} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
            <AnimatePresence>
              {filtered.map((u, i) => {
                const isSelf = u.$id === user.$id
                const cfg    = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.user
                return (
                  <motion.div key={u.$id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={[
                      "flex items-center justify-between px-4 py-3.5",
                      "border-b border-border/40 last:border-0 transition-colors duration-150",
                      isSelf ? "bg-muted/20" : "hover:bg-muted/30",
                    ].join(" ")}
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar initials */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${cfg.bg}`}
                        style={{ color: cfg.color }}>
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground truncate">{u.username}</span>
                          <RoleBadge role={u.role} />
                          {isSelf && <span className="text-[10px] text-muted-foreground">(you)</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="w-36 shrink-0 ml-3">
                      <CustomSelect
                        value={u.role}
                        onChange={(newRole) => handleRoleChange(u, newRole)}
                        disabled={isSelf}
                        placeholder="Select role"
                        options={ROLES.map(r => ({ value: r.value, label: r.label }))}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}