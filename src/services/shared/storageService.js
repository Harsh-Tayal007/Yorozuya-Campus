import { storage } from "@/lib/appwrite"

const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID

export const getPdfViewUrl = (fileId) => {
  return storage.getFileView(BUCKET_ID, fileId)
}

export const getPdfDownloadUrl = (fileId) => {
  return storage.getFileDownload(BUCKET_ID, fileId)
}
