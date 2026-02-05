import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/AuthContext"
import { getUsers, updateUserRole } from "@/services/userService"
import { ROLES } from "@/config/roles"
import { toast } from "sonner"

const roleBadgeClass = (role) => {
    switch (role) {
        case "admin":
            return "bg-red-100 text-red-700"
        case "moderator":
            return "bg-purple-100 text-purple-700"
        case "editor":
            return "bg-blue-100 text-blue-700"
        default:
            return "bg-gray-100 text-gray-700"
    }
}

export default function UserRolesAdmin() {
    const { user, role } = useAuth()
    const [users, setUsers] = useState([])
    const [search, setSearch] = useState("")

    useEffect(() => {
        getUsers().then(setUsers)
    }, [])

    const filtered = users.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase())
    )

    const handleRoleChange = async (targetUser, newRole) => {
        // 🔒 Phase 3.1 — Prevent self role change
        if (targetUser.$id === user.$id) {
            toast.error("Action blocked", {
                description: "You cannot change your own role.",
            })
            return
        }

        // 🔒 Phase 3.2 — Prevent demoting last admin
        const adminCount = users.filter(u => u.role === "admin").length
        const isLastAdmin =
            targetUser.role === "admin" &&
            newRole !== "admin" &&
            adminCount === 1

        if (isLastAdmin) {
            toast.error("Action blocked", {
                description: "There must always be at least one admin.",
            })
            return
        }

        try {
            await updateUserRole(
                targetUser.$id,
                newRole,
                {
                    $id: user.$id,
                    username: user.username,
                    role,
                },
                {
                    username: targetUser.username,
                    oldRole: targetUser.role,
                }
            )

            toast.success("Role updated", {
                description: `${targetUser.username} is now ${newRole}.`,
            })

            setUsers(await getUsers())
        } catch (err) {
            toast.error("Update failed", {
                description:
                    err?.message || "Something went wrong while updating the role.",
            })
        }
    }



    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">User Roles</h1>
                <p className="text-sm text-muted-foreground">
                    Manage roles and permissions for platform users
                </p>
            </div>

            {/* Search */}
            <Input
                placeholder="Search by username…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            {/* User list */}
            <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
                {filtered.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                        No users found
                    </div>
                )}

                {filtered.map((u) => {
                    const isSelf = u.$id === user.$id

                    return (
                        <div
                            key={u.$id}
                            className={`
                flex items-center justify-between px-4 py-3
                border-b last:border-b-0
                transition-colors
                ${isSelf ? "bg-muted/40" : "hover:bg-muted/60"}
              `}
                        >
                            {/* User info */}
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{u.username}</p>

                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeClass(
                                            u.role
                                        )}`}
                                    >
                                        {u.role}
                                    </span>

                                    {isSelf && (
                                        <span className="text-xs text-muted-foreground">
                                            (you)
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>

                            {/* Role selector */}
                            <Select
                                value={u.role}
                                disabled={isSelf}
                                onValueChange={(newRole) =>
                                    handleRoleChange(u, newRole)
                                }
                            >
                                <SelectTrigger
                                    className={`w-36 ${isSelf ? "opacity-60 cursor-not-allowed" : ""
                                        }`}
                                >
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
