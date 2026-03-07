export const fmt = (iso) => {
    if (!iso) return ""
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)

    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`
    return `${Math.floor(diff / 31536000)}y ago`
}

export const fmtVotes = (n) =>
  n >= 1e6
    ? (n / 1e6).toFixed(1).replace(".0", "") + "M"
    : n >= 1e3
    ? (n / 1e3).toFixed(1).replace(".0", "") + "k"
    : String(n)

export const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()