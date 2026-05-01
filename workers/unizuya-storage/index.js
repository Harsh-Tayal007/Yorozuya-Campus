/**
 * unizuya-storage — Cloudflare Worker
 *
 * R2 proxy for file upload, download, delete, and usage stats.
 * KV-backed active-storage toggle (appwrite | cloudflare).
 *
 * Bindings required in wrangler.toml:
 *   - R2_BUCKET  (R2 bucket)
 *   - STORAGE_KV (KV namespace)
 *   - STORAGE_SECRET (secret – env var)
 *
 * Deploy:  npx wrangler deploy
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

function err(message, status = 400) {
  return json({ error: message }, status)
}

function isAuthed(request, env) {
  const auth = request.headers.get("Authorization") || ""
  return auth === `Bearer ${env.STORAGE_SECRET}`
}

// ── MIME helpers ─────────────────────────────────────────────────────────────
const MIME_MAP = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

function guessContentType(key) {
  const ext = key.split(".").pop()?.toLowerCase()
  return MIME_MAP[ext] || "application/octet-stream"
}

// ── Router ───────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      // ── GET /config ─────────────────────────────────────────────────────
      if (request.method === "GET" && path === "/config") {
        const activeStorage = (await env.STORAGE_KV.get("active_storage")) || "appwrite"
        return json({ activeStorage })
      }

      // ── POST /config ────────────────────────────────────────────────────
      if (request.method === "POST" && path === "/config") {
        if (!isAuthed(request, env)) return err("Unauthorized", 401)
        const body = await request.json()
        const val = body.activeStorage
        if (val !== "appwrite" && val !== "cloudflare") {
          return err('activeStorage must be "appwrite" or "cloudflare"')
        }
        await env.STORAGE_KV.put("active_storage", val)
        return json({ activeStorage: val })
      }

      // ── POST /upload ────────────────────────────────────────────────────
      if (request.method === "POST" && path === "/upload") {
        if (!isAuthed(request, env)) return err("Unauthorized", 401)

        const key = url.searchParams.get("key")
        if (!key) return err("Missing ?key= query parameter")

        const contentType = request.headers.get("Content-Type") || ""

        let fileBody
        let fileName = key

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData()
          const file = formData.get("file")
          if (!file) return err("Missing 'file' field in form data")
          fileBody = file.stream()
          fileName = file.name || key
        } else {
          // Raw body upload
          fileBody = request.body
        }

        const object = await env.R2_BUCKET.put(key, fileBody, {
          httpMetadata: {
            contentType: guessContentType(fileName),
          },
          customMetadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        })

        return json({
          key: object.key,
          size: object.size,
          etag: object.etag,
        })
      }

      // ── DELETE /file/:type/:fileId ───────────────────────────────────────
      const deleteMatch = path.match(/^\/file\/([^/]+)\/([^/]+)$/)
      if (request.method === "DELETE" && deleteMatch) {
        if (!isAuthed(request, env)) return err("Unauthorized", 401)
        const objectKey = decodeURIComponent(`${deleteMatch[1]}/${deleteMatch[2]}`)
        await env.R2_BUCKET.delete(objectKey)
        return json({ deleted: objectKey })
      }

      // ── GET /file/:type/:fileId ─────────────────────────────────────────
      if (request.method === "GET" && deleteMatch) {
        // reuse the regex match from above — but we need to re-check
      }
      const getMatch = path.match(/^\/file\/([^/]+)\/([^/]+)$/)
      if (request.method === "GET" && getMatch) {
        const objectKey = decodeURIComponent(`${getMatch[1]}/${getMatch[2]}`)
        const object = await env.R2_BUCKET.get(objectKey)
        if (!object) return err("File not found", 404)

        const headers = new Headers(CORS_HEADERS)
        headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream")
        headers.set("Content-Length", object.size)
        headers.set("Cache-Control", "public, max-age=31536000, immutable")

        // Support range requests for video streaming
        headers.set("Accept-Ranges", "bytes")

        // Let browser handle Content-Disposition for inline viewing
        const fileName = object.customMetadata?.originalName || getMatch[2]
        headers.set("Content-Disposition", `inline; filename="${fileName}"`)

        return new Response(object.body, { headers })
      }

      // ── GET /file-meta/:type/:fileId ────────────────────────────────────
      const metaMatch = path.match(/^\/file-meta\/([^/]+)\/([^/]+)$/)
      if (request.method === "GET" && metaMatch) {
        if (!isAuthed(request, env)) return err("Unauthorized", 401)
        const objectKey = decodeURIComponent(`${metaMatch[1]}/${metaMatch[2]}`)
        const head = await env.R2_BUCKET.head(objectKey)
        if (!head) return err("File not found", 404)
        return json({
          key: head.key,
          size: head.size,
          etag: head.etag,
          contentType: head.httpMetadata?.contentType,
          uploaded: head.uploaded,
        })
      }

      // ── GET /usage ──────────────────────────────────────────────────────
      if (request.method === "GET" && path === "/usage") {
        if (!isAuthed(request, env)) return err("Unauthorized", 401)
        let totalSize = 0
        let fileCount = 0
        let cursor = undefined
        let truncated = true

        while (truncated) {
          const listing = await env.R2_BUCKET.list({ cursor, limit: 1000 })
          for (const obj of listing.objects) {
            totalSize += obj.size
            fileCount++
          }
          truncated = listing.truncated
          cursor = listing.cursor
        }

        return json({ totalSize, fileCount })
      }

      // ── Health ──────────────────────────────────────────────────────────
      if (path === "/" || path === "/health") {
        return json({ status: "ok", service: "unizuya-storage" })
      }

      return err("Not found", 404)
    } catch (e) {
      console.error("Worker error:", e)
      return err(`Internal error: ${e.message}`, 500)
    }
  },
}
