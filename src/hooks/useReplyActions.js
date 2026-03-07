import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createReply,
  deleteReply,
  hardDeleteReply,
  updateReply,
} from "@/services/forum/replyService";

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

        if (!newChildren[parent]) {
          newChildren[parent] = [];
        }

        return {
          byId: { ...old.byId, [tempId]: optimisticReply },
          children: {
            ...newChildren,
            [parent]: [tempId, ...newChildren[parent]],  // prepend = newest first
          },
        };
      });

      return { previousReplies, tempId };
    },

    onError: (err, newReply, context) => {
      queryClient.setQueryData(["replies", threadId], context.previousReplies);
    },

    onSuccess: (serverReply, newReply, context) => {
      queryClient.setQueryData(["replies", threadId], (old) => {
        if (!old) return old;

        const { tempId } = context;
        const newById = { ...old.byId };
        delete newById[tempId];
        newById[serverReply.$id] = serverReply;

        const newChildren = { ...old.children };
        for (const parent in newChildren) {
          newChildren[parent] = newChildren[parent].map((id) =>
            id === tempId ? serverReply.$id : id
          );
        }

        return { byId: newById, children: newChildren };
      });
    },
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  const deleteReplyMutation = useMutation({
    // mutationFn receives { replyId, hasChildren }
    mutationFn: ({ replyId, hasChildren }) =>
      hasChildren ? deleteReply(replyId) : hardDeleteReply(replyId),

    onMutate: async ({ replyId, hasChildren }) => {
      await queryClient.cancelQueries({ queryKey: ["replies", threadId] });

      const previousReplies = queryClient.getQueryData(["replies", threadId]);

      queryClient.setQueryData(["replies", threadId], (old) => {
        if (!old || !old.byId?.[replyId]) return old;

        if (hasChildren) {
          // Soft delete — keep in cache but mark deleted
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
          // Hard delete — remove from cache entirely
          const newById = { ...old.byId };
          delete newById[replyId];

          const newChildren = { ...old.children };
          for (const parent in newChildren) {
            newChildren[parent] = newChildren[parent].filter((id) => id !== replyId);
          }
          // Clean up this reply's own children bucket
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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", threadId] });
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

  return {
    createReply: createReplyMutation,
    deleteReply: deleteReplyMutation,
    updateReply: updateReplyMutation,
  };
}
