/**
 * storageAdapter.js
 *
 * Central abstraction layer for dual-storage (Appwrite + Cloudflare R2).
 * Routes upload / delete / view / download / metadata calls to the correct
 * backend based on the `storageProvider` field.
 */

import { storage, ID } from "@/lib/appwrite"
import {
  getStorageConfig,
  getWorkerUrl,
  getStorageSecret,
} from "./storageConfigService"
import {
  fetchCloudflareWorker,
  isWorkerUnavailableError,
  readJsonSafe,
} from "./cloudflareWorkerClient"

const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID

function resolveProvider(storageProvider) {
  return storageProvider || "appwrite"
}

function authedHeaders() {
  return {
    Authorization: `Bearer ${getStorageSecret()}`,
  }
}

/**
 * Get the currently active storage provider.
 * @returns {Promise<"appwrite" | "cloudflare">}
 */
export async function getActiveStorage() {
  const config = await getStorageConfig()
  return config.activeStorage
}

/**
 * Upload a file to the currently active storage.
 * @param {File} file
 * @param {"pyq" | "resource" | "syllabus"} type
 * @returns {Promise<{ fileId: string, storageProvider: "appwrite" | "cloudflare", bucketId?: string }>}
 */
export async function uploadFile(file, type) {
  const activeStorage = await getActiveStorage()

  if (activeStorage === "cloudflare") {
    return _uploadToCloudflare(file, type)
  }
  return _uploadToAppwrite(file)
}

async function _uploadToAppwrite(file) {
  const result = await storage.createFile(APPWRITE_BUCKET_ID, ID.unique(), file)
  return {
    fileId: result.$id,
    storageProvider: "appwrite",
    bucketId: APPWRITE_BUCKET_ID,
  }
}

async function _uploadToCloudflare(file, type) {
  const workerUrl = getWorkerUrl()
  if (!workerUrl) {
    return _uploadToAppwrite(file)
  }

  const fileId = ID.unique()
  const key = `${type}/${fileId}`

  const formData = new FormData()
  formData.append("file", file)

  try {
    const res = await fetchCloudflareWorker(`${workerUrl}/upload?key=${encodeURIComponent(key)}`, {
      timeoutMs: 20_000,
      workerName: "Storage worker",
      method: "POST",
      headers: authedHeaders(),
      body: formData,
    })

    if (!res.ok) {
      const errorData = await readJsonSafe(res)
      throw new Error(errorData.error || `Cloudflare upload failed: ${res.status}`)
    }

    return {
      fileId,
      storageProvider: "cloudflare",
    }
  } catch (err) {
    if (isWorkerUnavailableError(err)) {
      // Secondary fallback: keep uploads working through Appwrite.
      return _uploadToAppwrite(file)
    }
    throw err
  }
}

/**
 * Delete a file from the correct storage backend.
 * Uses the storageProvider from the document, NOT the current toggle.
 *
 * @param {string} fileId
 * @param {string} storageProvider - "appwrite" | "cloudflare" | undefined
 * @param {"pyq" | "resource" | "syllabus"} type
 * @param {string} [bucketId]
 */
export async function deleteFile(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    return _deleteFromCloudflare(fileId, type, bucketId)
  }
  return _deleteFromAppwrite(fileId, bucketId)
}

async function _deleteFromAppwrite(fileId, bucketId) {
  try {
    await storage.deleteFile(bucketId || APPWRITE_BUCKET_ID, fileId)
  } catch (err) {
    if (err?.code === 404 || err?.message?.includes("not found")) {
      return
    }
    throw err
  }
}

async function _deleteFromCloudflare(fileId, type, bucketId) {
  const workerUrl = getWorkerUrl()

  if (!workerUrl) {
    if (bucketId) return _deleteFromAppwrite(fileId, bucketId)
    throw new Error("Storage worker URL is not configured.")
  }

  try {
    const res = await fetchCloudflareWorker(`${workerUrl}/file/${type}/${fileId}`, {
      timeoutMs: 8_000,
      workerName: "Storage worker",
      allowStatuses: [404],
      method: "DELETE",
      headers: authedHeaders(),
    })

    if (!res.ok && res.status !== 404) {
      const errorData = await readJsonSafe(res)
      throw new Error(errorData.error || `Cloudflare delete failed: ${res.status}`)
    }
  } catch (err) {
    if (isWorkerUnavailableError(err) && bucketId) {
      return _deleteFromAppwrite(fileId, bucketId)
    }
    throw err
  }
}

/**
 * Get the URL for viewing/rendering a file in the browser.
 * @returns {string}
 */
export function getFileViewUrl(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    const workerUrl = getWorkerUrl()
    if (workerUrl) return `${workerUrl}/file/${type}/${fileId}`
    if (bucketId) return storage.getFileView(bucketId || APPWRITE_BUCKET_ID, fileId)
    return ""
  }
  return storage.getFileView(bucketId || APPWRITE_BUCKET_ID, fileId)
}

/**
 * Get the URL for downloading a file.
 * @returns {string}
 */
export function getFileDownloadUrl(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    const workerUrl = getWorkerUrl()
    if (workerUrl) return `${workerUrl}/file/${type}/${fileId}`
    if (bucketId) return storage.getFileDownload(bucketId || APPWRITE_BUCKET_ID, fileId)
    return ""
  }
  return storage.getFileDownload(bucketId || APPWRITE_BUCKET_ID, fileId)
}

/**
 * Get file metadata (size, etc).
 * @returns {Promise<{ size: number }>}
 */
export async function getFileMetadata(fileId, storageProvider, type, bucketId) {
  const provider = resolveProvider(storageProvider)

  if (provider === "cloudflare") {
    const workerUrl = getWorkerUrl()

    if (!workerUrl) {
      if (bucketId) {
        const fallbackFile = await storage.getFile(bucketId || APPWRITE_BUCKET_ID, fileId)
        return { size: fallbackFile.sizeOriginal }
      }
      throw new Error("Storage worker URL is not configured.")
    }

    try {
      const res = await fetchCloudflareWorker(`${workerUrl}/file-meta/${type}/${fileId}`, {
        timeoutMs: 8_000,
        workerName: "Storage worker",
        headers: authedHeaders(),
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch file metadata: ${res.status}`)
      }

      const data = await res.json()
      return { size: data.size }
    } catch (err) {
      if (isWorkerUnavailableError(err) && bucketId) {
        const fallbackFile = await storage.getFile(bucketId || APPWRITE_BUCKET_ID, fileId)
        return { size: fallbackFile.sizeOriginal }
      }
      throw err
    }
  }

  const file = await storage.getFile(bucketId || APPWRITE_BUCKET_ID, fileId)
  return { size: file.sizeOriginal }
}

/**
 * Calculate total Appwrite storage usage by paginating all files.
 * @returns {Promise<{ totalSize: number, fileCount: number }>}
 */
export async function getAppwriteUsage() {
  const { Query } = await import("appwrite")
  let totalSize = 0
  let fileCount = 0
  let offset = 0
  const BATCH_SIZE = 100

  while (true) {
    const batch = await storage.listFiles(APPWRITE_BUCKET_ID, [
      Query.limit(BATCH_SIZE),
      Query.offset(offset),
    ])

    for (const f of batch.files) {
      totalSize += f.sizeOriginal
      fileCount++
    }

    if (batch.files.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  return { totalSize, fileCount }
}

/**
 * Get Cloudflare R2 storage usage from the Worker.
 * @returns {Promise<{ totalSize: number, fileCount: number, unavailable?: boolean }>}
 */
export async function getCloudflareUsage() {
  const workerUrl = getWorkerUrl()
  if (!workerUrl) {
    return { totalSize: 0, fileCount: 0, unavailable: true }
  }

  try {
    const res = await fetchCloudflareWorker(`${workerUrl}/usage`, {
      timeoutMs: 8_000,
      workerName: "Storage worker",
      headers: authedHeaders(),
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch R2 usage: ${res.status}`)
    }

    return res.json()
  } catch (err) {
    if (isWorkerUnavailableError(err)) {
      return { totalSize: 0, fileCount: 0, unavailable: true }
    }
    throw err
  }
}
