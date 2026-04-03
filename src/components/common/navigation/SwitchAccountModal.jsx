import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Check, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { getSavedAccounts, removeSavedAccount, vaultGet, vaultRemove } from "@/lib/savedAccounts"
import { account } from "@/lib/appwrite"

// ── Switching overlay ─────────────────────────────────────────────────────────
const SwitchingOverlay = ({ target }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center
               bg-white dark:bg-[#080e1a]"
    >
        <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20
      bg-blue-400 dark:bg-blue-600 top-[-160px] left-[-160px] animate-pulse" />
        <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-15
      bg-indigo-400 dark:bg-violet-700 bottom-[-120px] right-[-120px] animate-pulse" />

        <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 relative z-10"
        >
            <div className="relative">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-20 h-20 rounded-full"
                    style={{
                        background: "conic-gradient(from 0deg, transparent 0%, #3b82f6 50%, transparent 100%)",
                        borderRadius: "50%",
                        padding: "2px",
                    }}
                />
                <div className="relative w-20 h-20 rounded-full p-0.5 bg-white dark:bg-[#080e1a]">
                    {target?.avatarUrl ? (
                        <img src={target.avatarUrl} alt={target.name}
                            className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                            flex items-center justify-center text-white text-2xl font-bold">
                            {target?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center space-y-1.5">
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-900 dark:text-white text-lg font-semibold">
                    Switching to {target?.name}
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-500 dark:text-slate-400 text-sm">
                    @{target?.username}
                </motion.p>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }} className="flex gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                ))}
            </motion.div>
        </motion.div>
    </motion.div>
)

const SwitchAccountModal = ({ open, onClose }) => {
    const { currentUser, logout, login } = useAuth()
    const navigate = useNavigate()
    const [accounts, setAccounts] = useState(() => getSavedAccounts())
    const [switching, setSwitching] = useState(null)
    const [switchingTarget, setSwitchingTarget] = useState(null)
    // Track which account has delete mode active (for touch devices)
    const [deleteMode, setDeleteMode] = useState(null)

    const reload = () => setAccounts(getSavedAccounts())
    const currentId = currentUser?.$id

    const handleSwitch = async (acc) => {
        if (acc.userId === currentId) return
        // If tapping an account that has delete mode open, close it instead
        if (deleteMode === acc.userId) {
            setDeleteMode(null)
            return
        }
        setSwitching(acc.userId)
        setSwitchingTarget(acc)

        try {
            const password = await vaultGet(acc.userId)
            if (password) {
                sessionStorage.setItem("unizuya_switch_to", JSON.stringify(acc))
                try { await account.deleteSession("current") } catch { }
                await login({ email: acc.email, password })
                sessionStorage.removeItem("unizuya_switch_to")
                window.location.href = "/dashboard"
                return
            }
        } catch {
            setSwitchingTarget(null)
        }

        sessionStorage.setItem("unizuya_switch_to", JSON.stringify(acc))
        window.location.href = "/login?switch=1"
    }

    const handleAddAccount = async () => {
        sessionStorage.removeItem("unizuya_switch_to")
        await logout()
        window.location.href = "/login"
    }

    const handleRemove = (e, userId) => {
        e.stopPropagation()
        removeSavedAccount(userId)
        vaultRemove(userId)
        setDeleteMode(null)
        reload()
    }

    const toggleDeleteMode = (e, userId) => {
        e.stopPropagation()
        setDeleteMode(prev => prev === userId ? null : userId)
    }

    return (
        <>
            <AnimatePresence>
                {switchingTarget && <SwitchingOverlay target={switchingTarget} />}
            </AnimatePresence>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
                            onClick={() => { setDeleteMode(null); onClose() }}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="
                                fixed z-[9999]
                                bottom-0 left-0 right-0 rounded-t-2xl
                                sm:bottom-auto sm:top-1/2 sm:left-1/2
                                sm:-translate-x-1/2 sm:-translate-y-1/2
                                sm:w-[380px] sm:rounded-2xl
                                bg-white dark:bg-[#0f1b2e]
                                border border-slate-200/80 dark:border-white/[0.07]
                                shadow-2xl overflow-hidden
                            "
                        >
                            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/5">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Accounts</h2>
                                <button onClick={onClose}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto py-2">
                                {accounts.length === 0 && (
                                    <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
                                        No saved accounts yet.
                                    </p>
                                )}

                                {accounts.map((acc) => {
                                    const isActive    = acc.userId === currentId
                                    const isSwitching = switching === acc.userId
                                    const isDeleting  = deleteMode === acc.userId

                                    return (
                                        <div key={acc.userId} className="relative">
                                            <button
                                                onClick={() => handleSwitch(acc)}
                                                disabled={isActive || !!switching}
                                                className="
                                                    w-full flex items-center gap-3 px-5 py-3
                                                    hover:bg-slate-50 dark:hover:bg-white/5
                                                    transition-colors duration-150 disabled:cursor-default
                                                    group text-left
                                                "
                                            >
                                                <div className="relative shrink-0">
                                                    {acc.avatarUrl ? (
                                                        <img src={acc.avatarUrl} alt={acc.name}
                                                            className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                                                            flex items-center justify-center text-white text-sm font-semibold">
                                                            {(acc.name || acc.email)?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {isActive && (
                                                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full
                                                            border-2 border-white dark:border-[#0f1b2e] flex items-center justify-center">
                                                            <Check size={9} strokeWidth={3} className="text-white" />
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                                                        {acc.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                                        @{acc.username}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-2">
                                                    {isActive && <span className="text-xs font-medium text-green-500">Active</span>}
                                                    {isSwitching && (
                                                        <svg className="animate-spin w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                        </svg>
                                                    )}
                                                    {!isActive && !isSwitching && (
                                                        <button
                                                            onClick={(e) => toggleDeleteMode(e, acc.userId)}
                                                            className={`p-1 rounded-md transition
                                                                /* hover: always show on desktop */
                                                                opacity-0 group-hover:opacity-100
                                                                /* touch: always visible */
                                                                [@media(hover:none)]:opacity-100
                                                                ${isDeleting
                                                                    ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                                                                    : "text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                                }`}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </button>

                                            {/* Confirm delete row — slides in below on touch */}
                                            <AnimatePresence>
                                                {isDeleting && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="overflow-hidden px-5"
                                                    >
                                                        <div className="flex items-center justify-between py-2.5 border-t border-red-100 dark:border-red-500/20">
                                                            <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                                Remove @{acc.username}?
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteMode(null) }}
                                                                    className="px-3 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400
                                                                        hover:bg-slate-100 dark:hover:bg-white/10 transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleRemove(e, acc.userId)}
                                                                    className="px-3 py-1 rounded-lg text-xs font-semibold
                                                                        bg-red-500 hover:bg-red-600 text-white transition"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="border-t border-slate-100 dark:border-white/5 p-3">
                                <button
                                    onClick={handleAddAccount}
                                    className="
                                        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                                        bg-slate-50 dark:bg-white/5
                                        hover:bg-slate-100 dark:hover:bg-white/10
                                        border border-slate-200/60 dark:border-white/[0.07]
                                        text-slate-700 dark:text-slate-200 text-sm font-medium
                                        transition-colors duration-150
                                    "
                                >
                                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                        <Plus size={14} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Add account
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default SwitchAccountModal