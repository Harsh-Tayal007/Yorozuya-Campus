// src/components/forum/BannedBanner.jsx
import { ShieldX } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function BannedBanner() {
  const { currentUser } = useAuth()
  const ban = currentUser?.activeBan

  if (!ban) return null

  const expiry =
    ban.banType === "temporary" && ban.expiresAt
      ? new Date(ban.expiresAt).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : null

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3 items-start">
      <ShieldX size={18} className="text-red-400 mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-red-400">
          {ban.banType === "permanent" ? "Permanently banned" : "Temporarily banned"}
        </p>
        <p className="text-slate-400 mt-0.5">
          <span className="font-medium text-slate-300">Reason:</span> {ban.reason}
        </p>
        {expiry && (
          <p className="text-slate-400 mt-0.5">
            <span className="font-medium text-slate-300">Expires:</span> {expiry}
          </p>
        )}
        <p className="text-slate-500 mt-1 text-xs">
          You can read content but cannot post or reply. Contact{" "}
          <a href="mailto:support@unizuya.in" className="text-blue-400 hover:underline">
            support@unizuya.in
          </a>{" "}
          to appeal.
        </p>
      </div>
    </div>
  )
}