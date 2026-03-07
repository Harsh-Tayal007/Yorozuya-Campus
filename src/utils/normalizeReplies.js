export const normalizeReplies = (replies) => {

  if (!Array.isArray(replies)) {
    return {
      byId: {},
      children: { null: [] }
    }
  }

  const byId = {}
  const children = {}

  for (const reply of replies) {
    byId[reply.$id] = reply

    const parent = reply.parentReplyId ?? null

    if (!children[parent]) {
      children[parent] = []
    }

    children[parent].push(reply.$id)
  }

  // ensure root bucket always exists
  if (!children[null]) {
    children[null] = []
  }

  // Sort every bucket: newest first, deleted replies sink to bottom
  const sortBucket = (ids) => {
    return [...ids].sort((a, b) => {
      const ra = byId[a]
      const rb = byId[b]

      // Deleted replies always sink to bottom
      if (ra?.deleted && !rb?.deleted) return 1
      if (!ra?.deleted && rb?.deleted) return -1

      // Otherwise sort newest first
      return new Date(rb?.$createdAt ?? 0) - new Date(ra?.$createdAt ?? 0)
    })
  }

  for (const key in children) {
    children[key] = sortBucket(children[key])
  }

  return { byId, children }
}
