export const buildReplyTree = (replies) => {
  const map = new Map()
  const roots = []

  // Create lookup map
  for (const reply of replies) {
    map.set(reply.$id, { ...reply, replies: [] })
  }

  // Build hierarchy
  for (const reply of replies) {
    const node = map.get(reply.$id)

    if (reply.parentReplyId && map.has(reply.parentReplyId)) {
      map.get(reply.parentReplyId).replies.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}