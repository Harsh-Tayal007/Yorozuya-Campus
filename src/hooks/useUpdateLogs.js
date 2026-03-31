// src/hooks/useUpdateLogs.js
import { useState, useEffect, useCallback } from "react"
import { updateLogsService } from "@/services/updates/updateLogsService"
import { useAuth } from "@/context/AuthContext"

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