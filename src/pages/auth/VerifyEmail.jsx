/**
 * VerifyEmail.jsx
 * Route: /verify-email
 *
 * Handles the callback link from the verification email.
 * States: verifying → success | error
 */

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { confirmVerification } from "@/services/auth/emailVerificationService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useAuth } from "@/context/AuthContext"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = "users"

const VerifyEmail = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { refreshUser } = useAuth()

    const userId = searchParams.get("userId")
    const secret = searchParams.get("secret")

    const [status, setStatus] = useState("verifying") // verifying | success | error
    const [errorMsg, setErrorMsg] = useState("")
    const ran = useRef(false)

    useEffect(() => {
        if (ran.current) return
        ran.current = true

        if (!userId || !secret) {
            setStatus("error")
            setErrorMsg("Invalid verification link. Please request a new one.")
            return
        }

        const verify = async () => {
            try {
                // 1. Confirm with Appwrite
                await confirmVerification({ userId, secret })

                // 2. Mark emailVerified: true in our users collection
                try {
                    const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
                        Query.equal("userId", userId),
                    ])
                    if (res.total > 0) {
                        await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, res.documents[0].$id, {
                            emailVerified: true,
                        })
                    }
                } catch {
                    // Non-fatal - Appwrite's emailVerification flag is already set
                }

                // 3. Refresh context so emailVerified flips to true in memory -
                //    this unmounts the gate before we navigate, preventing the redirect loop
                await refreshUser()

                setStatus("success")
                setTimeout(() => navigate("/dashboard", { replace: true }), 2200)
            } catch (err) {
                setStatus("error")
                setErrorMsg(
                    err?.message?.includes("invalid")
                        ? "This link has already been used or has expired."
                        : "Verification failed. Please try again."
                )
            }
        }

        verify()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const meta = document.createElement("meta")
        meta.name = "robots"
        meta.content = "noindex, nofollow"
        document.head.appendChild(meta)
        return () => document.head.removeChild(meta) // cleanup on unmount
    }, [])

    return (
        <div className="
      relative min-h-screen flex items-center justify-center overflow-hidden px-4
      bg-gradient-to-br from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]
    ">
            <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30
        bg-blue-400 dark:bg-blue-600 top-[-160px] left-[-160px]" />
            <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20
        bg-indigo-400 dark:bg-violet-700 bottom-[-120px] right-[-120px]" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full max-w-sm"
            >
                <div className="
          bg-white/90 dark:bg-[#0f1b2e]/80 backdrop-blur-2xl
          border border-slate-200/80 dark:border-white/[0.07]
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60
          rounded-2xl p-10 text-center
        ">
                    {status === "verifying" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <Loader2 className="text-blue-500 animate-spin" size={28} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verifying your email…</h2>
                            <p className="text-sm text-slate-400">Hang tight, this takes a second.</p>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="space-y-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                                className="mx-auto w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center"
                            >
                                <CheckCircle className="text-green-500" size={34} />
                            </motion.div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email verified!</h2>
                                <p className="text-sm text-slate-400 mt-1.5">Redirecting you to dashboard…</p>
                            </div>
                            <div className="flex justify-center">
                                <div className="h-1 w-32 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2.2, ease: "linear" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                <XCircle className="text-red-500" size={28} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verification failed</h2>
                                <p className="text-sm text-slate-400 mt-1.5">{errorMsg}</p>
                            </div>
                            <button
                                onClick={() => navigate("/dashboard", { replace: true })}
                                className="w-full h-10 rounded-xl font-semibold text-sm text-white
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-500 hover:to-indigo-500
                  shadow-lg shadow-blue-600/25 transition-all duration-200"
                            >
                                Request new link
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default VerifyEmail