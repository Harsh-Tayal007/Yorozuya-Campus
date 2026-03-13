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

export default function useReplyActions(threadId) {
  const queryClient = useQueryClient();

  // ─── CREATE ───────────────────────────────────────────────────────────────

  const createReplyMutation = useMutation({
    mutationFn: createReply,

    onMutate: async (newReply) => {
      await queryClient.cancelQueries({ queryKey: ["replies", threadId] });

      const previousReplies = queryClient.getQueryData(["replies", threadId]);
      const tempId = "temp-" + Date.now();

      const optimisticReply = {
        ...newReply,
        $id: tempId,
        $createdAt: new Date().toISOString(),
        upvotes: 0,
        isPinned: false,
      };

      queryClient.setQueryData(["replies", threadId], (old) => {
        if (!old) return old;
        const parent = newReply.parentReplyId ?? null;
        const newChildren = { ...old.children };
        if (!newChildren[parent]) newChildren[parent] = [];
        return {
          byId: { ...old.byId, [tempId]: optimisticReply },
          children: { ...newChildren, [parent]: [tempId, ...newChildren[parent]] },
        };
      });

      // Optimistically increment repliesCount on thread card
      queryClient.setQueryData(["threads"], (old = []) =>
        old.map(t => t.$id === threadId
          ? { ...t, repliesCount: (t.repliesCount ?? 0) + 1 }
          : t
        )
      );

      return { previousReplies, tempId };
    },

    onError: (err, newReply, context) => {
      queryClient.setQueryData(["replies", threadId], context.previousReplies);
      // Roll back optimistic increment
      queryClient.setQueryData(["threads"], (old = []) =>
        old.map(t => t.$id === threadId
          ? { ...t, repliesCount: Math.max(0, (t.repliesCount ?? 1) - 1) }
          : t
        )
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
          newChildren[parent] = newChildren[parent].map(id =>
            id === tempId ? serverReply.$id : id
          );
        }
        return { byId: newById, children: newChildren };
      });

      // Persist repliesCount to Appwrite (fire and forget)
      incrementRepliesCount(threadId).then(() => {
        // Sync thread cache with real DB value
        queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
        queryClient.invalidateQueries({ queryKey: ["threads"] });
      }).catch(console.error);
    },
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  const deleteReplyMutation = useMutation({
    mutationFn: ({ replyId, hasChildren }) =>
      hasChildren ? deleteReply(replyId) : hardDeleteReply(replyId),

    onMutate: async ({ replyId, hasChildren }) => {
      await queryClient.cancelQueries({ queryKey: ["replies", threadId] });
      const previousReplies = queryClient.getQueryData(["replies", threadId]);

      queryClient.setQueryData(["replies", threadId], (old) => {
        if (!old || !old.byId?.[replyId]) return old;

        if (hasChildren) {
          return {
            ...old,
            byId: {
              ...old.byId,
              [replyId]: {
                ...old.byId[replyId],
                content: "[deleted]",
                deleted: true,
                gifUrl: null,
                imageUrl: null,
                imagePublicId: null,
              },
            },
          };
        } else {
          const newById = { ...old.byId };
          delete newById[replyId];
          const newChildren = { ...old.children };
          for (const parent in newChildren) {
            newChildren[parent] = newChildren[parent].filter(id => id !== replyId);
          }
          delete newChildren[replyId];
          return { byId: newById, children: newChildren };
        }
      });

      return { previousReplies };
    },

    onError: (err, variables, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(["replies", threadId], context.previousReplies);
      }
    },

    onSuccess: (_, { hasChildren }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] });

      // Only decrement for hard deletes (soft deletes keep the reply visible as [deleted])
      if (!hasChildren) {
        // Optimistically decrement in threads list cache
        queryClient.setQueryData(["threads"], (old = []) =>
          old.map(t => t.$id === threadId
            ? { ...t, repliesCount: Math.max(0, (t.repliesCount ?? 1) - 1) }
            : t
          )
        );

        decrementRepliesCount(threadId).then(() => {
          queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
          queryClient.invalidateQueries({ queryKey: ["threads"] });
        }).catch(console.error);
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
              imageUrl: updatedReply.imageUrl ?? old.byId[updatedReply.$id].imageUrl,
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
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] });
    },
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
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] });
    },
  });

  return {
    createReply: createReplyMutation,
    deleteReply: deleteReplyMutation,
    updateReply: updateReplyMutation,
    pinReply: pinReplyMutation,
    unpinReply: unpinReplyMutation,
  };
}