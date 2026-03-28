import { toast } from "sonner"

/**
 * Copies a full URL to clipboard and shows a toast.
 * @param {string} path - e.g. "/forum/abc123" or "/forum/abc123?focus=xyz"
 */
export async function copyShareLink(path) {
  const url = `${window.location.origin}${path}`
  try {
    await navigator.clipboard.writeText(url)
    toast.success("Link copied!", { description: url, duration: 2500 })
  } catch {
    // Fallback for older browsers / non-https
    const el = document.createElement("textarea")
    el.value = url
    el.style.position = "fixed"
    el.style.opacity = "0"
    document.body.appendChild(el)
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
    toast.success("Link copied!")
  }
}