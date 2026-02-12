import { storage } from "@/lib/appwrite";

/**
 * Downloads a file with a forced custom filename
 * (bypasses Appwrite Content-Disposition)
 */
export async function downloadFile({ bucketId, fileId, filename }) {
  if (!bucketId || !fileId) {
    throw new Error("downloadFile: bucketId or fileId missing");
  }

  const downloadUrl = storage.getFileDownload(bucketId, fileId);

  // 1️⃣ Fetch file as blob
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error("Failed to download file");
  }

  const blob = await response.blob();

  // 2️⃣ Create local object URL
  const blobUrl = window.URL.createObjectURL(blob);

  // 3️⃣ Force download with custom filename
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();

  // 4️⃣ Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

export function downloadFileXHR({
  url,
  fileName,
  onProgress,
  onSuccess,
  onError,
  onCancel,
}) {
  const xhr = new XMLHttpRequest();
  xhr.responseType = "blob";

  xhr.open("GET", url, true);

  xhr.onprogress = (event) => {
    if (!onProgress) return;

    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    } else {
      onProgress({ loaded: event.loaded });
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      const blob = xhr.response;
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      onSuccess?.();
    } else {
      onError?.("Download failed");
    }
  };

  xhr.onerror = () => {
    onError?.("Network error");
  };

  xhr.onabort = () => {
    onCancel?.();
  };

  xhr.send();

  // 🔑 IMPORTANT: return cancel handle
  return {
    cancel: () => xhr.abort(),
  };
}
