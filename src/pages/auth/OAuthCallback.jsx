import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { account, databases } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { USERS_COLLECTION_ID } from "@/config/appwrite"
import { generateAvailableUsername } from "@/services/admin/authService"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = USERS_COLLECTION_ID

const OAuthCallback = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState("Finishing sign-in…")
  const [errorDetail, setErrorDetail] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Small delay to ensure Appwrite session cookie is set
        await new Promise(r => setTimeout(r, 800))

        const accountUser = await account.get()

        const byUserId = await databases.listDocuments(
          DATABASE_ID, USERS_TABLE_ID,
          [Query.equal("userId", accountUser.$id)]
        )

        if (byUserId.total > 0) {
          window.location.replace("/dashboard")
          return
        }

        setStatus("Checking your account…")

        const byEmail = await databases.listDocuments(
          DATABASE_ID, USERS_TABLE_ID,
          [Query.equal("email", accountUser.email)]
        )

        if (byEmail.total > 0) {
          setStatus("Linking your account…")
          const existingDoc = byEmail.documents[0]
          await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, existingDoc.$id, {
            userId: accountUser.$id
          })
          window.location.replace("/dashboard")
          return
        }

        setStatus("Setting up your profile…")
        const username = await generateAvailableUsername(accountUser.name || "user")

        await databases.createDocument(DATABASE_ID, USERS_TABLE_ID, ID.unique(), {
          userId:           accountUser.$id,
          email:            accountUser.email,
          name:             accountUser.name || "",
          username,
          role:             "user",
          universityId:     null,
          programId:        null,
          branchId:         null,
          profileCompleted: false,
          avatarUrl:        null,
          avatarPublicId:   null,
          bio:              null,
          yearOfStudy:      null,
        })

        window.location.replace("/dashboard")

      } catch (err) {
        console.error("OAuth callback failed:", err)
        // Show error on screen instead of immediately redirecting
        // so we can see what's actually failing
        setErrorDetail(err?.message || String(err))
        setStatus("Something went wrong.")
        setTimeout(() => navigate("/login", { replace: true }), 5000)
      }
    }

    handleCallback()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="
      min-h-screen flex flex-col items-center justify-center gap-4
      bg-gradient-to-br from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]
    ">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      </div>

      <div className="flex items-center gap-3">
        {!errorDetail && (
          <svg className="animate-spin w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">{status}</p>
      </div>

      {/* Show error detail on screen for debugging */}
      {errorDetail && (
        <div className="max-w-md mx-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3">
          <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">{errorDetail}</p>
          <p className="text-xs text-slate-400 mt-2">Redirecting to login in 5s…</p>
        </div>
      )}
    </div>
  )
}

export default OAuthCallback