import { databases, ID } from "@/lib/appwrite"
import {
  fetchCloudflareWorker,
  isWorkerUnavailableError,
  readJsonSafe,
} from "./cloudflareWorkerClient"

const WORKER_URL = import.meta.env.VITE_CONTACT_WORKER_URL
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const CONTACT_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CONTACT_COLLECTION_ID

async function submitViaAppwriteFallback({ name, email, message }) {
  if (!DATABASE_ID || !CONTACT_COLLECTION_ID) return false

  await databases.createDocument(DATABASE_ID, CONTACT_COLLECTION_ID, ID.unique(), {
    name,
    email,
    message,
    status: "new",
  })

  return true
}

export async function submitContactForm({ name, email, message }) {
  const payload = { name, email, message }

  if (!WORKER_URL) {
    const ok = await submitViaAppwriteFallback(payload).catch(() => false)
    if (ok) return { ok: true, mode: "appwrite-fallback" }
    throw new Error("Contact service is not configured.")
  }

  try {
    const response = await fetchCloudflareWorker(WORKER_URL, {
      timeoutMs: 10_000,
      workerName: "Contact worker",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await readJsonSafe(response)
    if (!response.ok) {
      throw new Error(data?.error || "Failed to send message.")
    }

    return {
      ok: true,
      mode: "live",
    }
  } catch (err) {
    if (isWorkerUnavailableError(err)) {
      const ok = await submitViaAppwriteFallback(payload).catch(() => false)
      if (ok) {
        return {
          ok: true,
          mode: "appwrite-fallback",
        }
      }
      throw new Error("Contact service is temporarily unavailable. Please try again shortly.")
    }

    throw new Error(err?.message || "Failed to send message.")
  }
}
