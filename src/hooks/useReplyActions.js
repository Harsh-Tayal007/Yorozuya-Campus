// src/hooks/useReplyActions.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createReply,
  deleteReply,
  hardDeleteReply,
  updateReply,
  pinReply,
  unpinReply,
} from "@/services/forum/replyService";
import {
  incrementRepliesCount,
  decrementRepliesCount,
} from "@/services/forum/threadService";
import {
  createNotification,
  getUserIdByUsername,
} from "@/services/notification/notificationService";
import { useAuth } from "@/context/AuthContext";

// Extract @username mentions from plain text or HTML content
function extractMentions(content = "") {
  if (!content) return [];
  const plain = content.replace(/<[^>]+>/g, " ");
  const matches = plain.match(/@([\w]+)/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export default function useReplyActions(threadId) {
  const queryClient = useQueryClient();

  // ─── CREATE ───────────────────────────────────────────────────────────────
  const { user } = useAuth(); // add this import at top: import { useAuth } from "@/context/AuthContext"

  const createReplyMutation = useMutation({
    mutationFn: (vars) => {
      if (user?.isBanned)
        throw new Error("You are banned and cannot post replies.");
      return createReply(vars);
    },

    onMutate: async (newReply) => {
      await queryClient.cancelQueries({ queryKey: ["replies", threadId] });
      const previousReplies = queryClient.getQueryData(["replies", threadId]);
      const tempId = "temp-" + Date.now();
      const optimisticReply = {
        ...newReply,
        $id: tempId,
        $createdAt: new Date().toISOString(),
        upvotes: 1, // ← default +1
        isPinned: false,
      };
      queryClient.setQueryData(["replies", threadId], (old) => {
        if (!old) return old;
        const parent = newReply.parentReplyId ?? null;
        const newChildren = { ...old.children };
        if (!newChildren[parent]) newChildren[parent] = [];
        return {
          byId: { ...old.byId, [tempId]: optimisticReply },
          children: {
            ...newChildren,
            [parent]: [tempId, ...newChildren[parent]],
          },
        };
      });
      queryClient.setQueryData(["threads"], (old = []) =>
        old.map((t) =>
          t.$id === threadId
            ? { ...t, repliesCount: (t.repliesCount ?? 0) + 1 }
            : t,
        ),
      );
      return { previousReplies, tempId };
    },

    onError: (err, newReply, context) => {
      queryClient.setQueryData(["replies", threadId], context.previousReplies);
      queryClient.setQueryData(["threads"], (old = []) =>
        old.map((t) =>
          t.$id === threadId
            ? { ...t, repliesCount: Math.max(0, (t.repliesCount ?? 1) - 1) }
            : t,
        ),
      );
    },

    onSuccess: (serverReply, newReply, context) => {
      // Swap temp ID for real ID
      queryClient.setQueryData(["replies", threadId], (old) => {
        if (!old) return old;
        const { tempId } = context;
        const newById = { ...old.byId };
        delete newById[tempId];
        newById[serverReply.$id] = serverReply;
        const newChildren = { ...old.children };
        for (const parent in newChildren) {
          newChildren[parent] = newChildren[parent].map((id) =>
            id === tempId ? serverReply.$id : id,
          );
        }
        return { byId: newById, children: newChildren };
      });

      // Seed votesMap so the author's upvote arrow renders red immediately
      queryClient.setQueryData(["votes", threadId], (old = {}) => ({
        ...old,
        [serverReply.$id]: { vote: "up", voteDocId: null },
      }));

      // Refetch real voteDocId so undo-vote works correctly
      queryClient.invalidateQueries({ queryKey: ["votes", threadId] });

      incrementRepliesCount(threadId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
          queryClient.invalidateQueries({ queryKey: ["threads"] });
        })
        .catch(console.error);

      // Fire notifications — never block UI
      fireReplyNotifications(serverReply, newReply, threadId).catch(
        console.error,
      );
    },
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  const deleteReplyMutation = useMutation({
  // ① Pass modDeleted through to the service call
  mutationFn: ({ replyId, hasChildren, modDeleted = false }) =>
    hasChildren
      ? deleteReply(replyId, modDeleted)   // soft-delete: needs the flag
      : hardDeleteReply(replyId),          // hard-delete: no content to flag
 
  onMutate: async ({ replyId, hasChildren, modDeleted = false }) => {
    await queryClient.cancelQueries({ queryKey: ["replies", threadId] })
    const previousReplies = queryClient.getQueryData(["replies", threadId])
 
    queryClient.setQueryData(["replies", threadId], (old) => {
      if (!old || !old.byId?.[replyId]) return old
      if (hasChildren) {
        return {
          ...old,
          byId: {
            ...old.byId,
            [replyId]: {
              ...old.byId[replyId],
              // ② Show the right label immediately in the UI
              content:        modDeleted ? "[deleted by mods]" : "[deleted]",
              deleted:        true,
              modDeleted:     modDeleted,
              gifUrl:         null,
              imageUrl:       null,
              imagePublicId:  null,
            },
          },
        }
      } else {
        const newById = { ...old.byId }
        delete newById[replyId]
        const newChildren = { ...old.children }
        for (const parent in newChildren) {
          newChildren[parent] = newChildren[parent].filter(id => id !== replyId)
        }
        delete newChildren[replyId]
        return { byId: newById, children: newChildren }
      }
    })
 
    return { previousReplies }
  },
 
  onError: (err, variables, context) => {
    if (context?.previousReplies) {
      queryClient.setQueryData(["replies", threadId], context.previousReplies)
    }
  },
 
  onSuccess: (_, { hasChildren }) => {
    queryClient.invalidateQueries({ queryKey: ["replies", threadId] })
    if (!hasChildren) {
      queryClient.setQueryData(["threads"], (old = []) =>
        old.map(t =>
          t.$id === threadId
            ? { ...t, repliesCount: Math.max(0, (t.repliesCount ?? 1) - 1) }
            : t
        )
      )
      decrementRepliesCount(threadId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["thread", threadId] })
          queryClient.invalidateQueries({ queryKey: ["threads"] })
        })
        .catch(console.error)
    }
  },
});

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  const updateReplyMutation = useMutation({
    mutationFn: updateReply,
    onSuccess: (updatedReply) => {
      queryClient.setQueryData(["replies", threadId], (old) => {
        if (!old || !old.byId?.[updatedReply.$id]) return old;
        return {
          ...old,
          byId: {
            ...old.byId,
            [updatedReply.$id]: {
              ...old.byId[updatedReply.$id],
              content: updatedReply.content,
              gifUrl: updatedReply.gifUrl ?? old.byId[updatedReply.$id].gifUrl,
              imageUrl:
                updatedReply.imageUrl ?? old.byId[updatedReply.$id].imageUrl,
            },
          },
        };
      });
    },
  });

  // ─── PIN / UNPIN ──────────────────────────────────────────────────────────
  const pinReplyMutation = useMutation({
    mutationFn: ({ replyId, threadId, currentPinnedReplyId }) =>
      pinReply(replyId, threadId, currentPinnedReplyId),
    onSuccess: (_, { replyId, threadId }) => {
      queryClient.setQueryData(["thread", threadId], (old) => {
        if (!old) return old;
        return { ...old, pinnedReplyId: replyId };
      });
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] });
    },
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] }),
  });

  const unpinReplyMutation = useMutation({
    mutationFn: ({ replyId, threadId }) => unpinReply(replyId, threadId),
    onSuccess: (_, { threadId }) => {
      queryClient.setQueryData(["thread", threadId], (old) => {
        if (!old) return old;
        return { ...old, pinnedReplyId: null };
      });
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] });
    },
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] }),
  });

  return {
    createReply: createReplyMutation,
    deleteReply: deleteReplyMutation,
    updateReply: updateReplyMutation,
    pinReply: pinReplyMutation,
    unpinReply: unpinReplyMutation,
  };
}

// =============================================================================
// NOTIFICATION HELPERS
// =============================================================================
async function fireReplyNotifications(serverReply, newReply, threadId) {
  const actorId = newReply.authorId;
  const actorName = newReply.authorName;
  const actorAvatar = newReply.actorAvatar ?? null;
  const actorUsername = newReply.actorUsername ?? null;

  // Plain-text preview of what was written (max 200 chars)
  const replyContent = (newReply.content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  const promises = [];

  // ── 1. Reply notification ─────────────────────────────────────────────────
  // parentAuthorId set  → replying to someone's comment → "replied to your comment"
  // only threadAuthorId → root reply on thread          → "replied to your thread"
  const isNestedReply = !!newReply.parentAuthorId;
  const recipientId =
    newReply.parentAuthorId ?? newReply.threadAuthorId ?? null;
  const replyMessage = isNestedReply
    ? "replied to your comment."
    : "replied to your thread.";

  if (recipientId && recipientId !== actorId) {
    promises.push(
      createNotification({
        recipientId,
        type: "reply",
        actorId,
        actorName,
        actorAvatar,
        actorUsername,
        threadId,
        replyId: serverReply.$id,
        replyContent,
        message: replyMessage,
      }),
    );
  }

  // ── 2. Mention notifications ──────────────────────────────────────────────
  // Notify every @mentioned user, PLUS the author of the parent comment
  // if they were mentioned (deduplicated via Set below)
  const mentionedUsernames = extractMentions(newReply.content);

  // Also include anyone in the existing reply chain who might be mentioned
  // (the parentAuthorUsername if provided — passed from Reply.jsx)
  const allMentions = new Set(mentionedUsernames);

  if (allMentions.size > 0) {
    const userDocs = await Promise.all(
      [...allMentions].map((username) => getUserIdByUsername(username)),
    );
    for (const doc of userDocs) {
      if (!doc) continue;
      const mentionedUserId = doc.userId;
      // Skip actor and skip anyone already notified by the reply notification
      if (!mentionedUserId || mentionedUserId === actorId) continue;
      if (mentionedUserId === recipientId) continue; // avoid double-notif

      promises.push(
        createNotification({
          recipientId: mentionedUserId,
          type: "mention",
          actorId,
          actorName,
          actorAvatar,
          actorUsername,
          threadId,
          replyId: serverReply.$id,
          replyContent,
          message: "mentioned you in a reply.",
        }),
      );
    }
  }

  const results = await Promise.allSettled(promises);
  results.forEach((r) => {
    if (r.status === "rejected")
      console.error("Notification failed:", r.reason);
  });
}
