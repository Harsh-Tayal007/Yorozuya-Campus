// src/hooks/useUpdateLogs.js
import { useState, useEffect, useCallback } from "react"
import { updateLogsService } from "@/services/updates/updateLogsService"
import { useAuth } from "@/context/AuthContext"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DB       = import.meta.env.VITE_APPWRITE_DATABASE_ID
const PUSH_COL = import.meta.env.VITE_APPWRITE_PUSH_SUBSCRIPTIONS_COLLECTION_ID
const PUSH_URL = import.meta.env.VITE_PUSH_WORKER_URL

async function fanOutUpdateNotification(title, body, version) {
  try {
    const res = await databases.listDocuments(DB, PUSH_COL, [Query.limit(500)])
    if (res.total === 0) return

    const subscriptions = res.documents.map(doc => ({
      endpoint: doc.endpoint,
      keys: { p256dh: doc.p256dh, auth: doc.auth },
    }))

    const plainBody = body?.replace(/<[^>]+>/g, "").slice(0, 100) ?? ""

    await fetch(`${PUSH_URL}/send-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptions,
        title: `📣 ${title}${version ? ` ${version}` : ""}`,
        body:  plainBody,
        url:   "/updates",
        tag:   "changelog",
        type:  "changelog",
      }),
    })
  } catch (e) {
    console.warn("Fan-out failed:", e)
  }
}

export default function useUpdateLogs() {
  const { user } = useAuth()
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await updateLogsService.list()
      setLogs(res.documents)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const save = async (formData, editingId) => {
    setSaving(true); setError(null)
    try {
      const payload = {
        ...formData,
        publishedAt: formData.isPublished ? new Date().toISOString() : null,
        createdBy: user.$id,
      }

      if (editingId) {
        const doc = await updateLogsService.update(editingId, payload)
        setLogs(p => p.map(l => l.$id === editingId ? doc : l))
      } else {
        const doc = await updateLogsService.create(payload)
        setLogs(p => [doc, ...p])
      }

      // Fan-out push only on fresh publish (not drafts, not edits to already-published)
      if (formData.isPublished && !editingId) {
        fanOutUpdateNotification(formData.title, formData.body, formData.version)
      }

      return true
    } catch (e) { setError(e.message); return false }
    finally { setSaving(false) }
  }

  const remove = async (id) => {
    try {
      await updateLogsService.delete(id)
      setLogs(p => p.filter(l => l.$id !== id))
    } catch (e) { setError(e.message) }
  }

  return { logs, loading, saving, error, save, remove, refresh: fetch }
}