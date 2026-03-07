import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchRepliesByThread,
  createReply,
} from "@/services/forum/replyService";
import { normalizeReplies } from "@/utils/normalizeReplies";

export const useReplies = (threadId) => {
  //   const { data: replies = [], isLoading } = useQuery({
  //     queryKey: ["replies", threadId],
  //     queryFn: () => fetchRepliesByThread(threadId),
  //     enabled: !!threadId,

  //     staleTime: 0, // cache stays fresh
  //     gcTime: 1000 * 60 * 5,

  //     refetchOnMount: true, // When you visit the thread again: When you visit the thread again:
  //     refetchOnWindowFocus: false, // When you switch tabs and come back: React Query → fetch new replies
  //   });

  const { data: replies = { byId: {}, children: { null: [] } }, isLoading } =
    useQuery({
      queryKey: ["replies", threadId],
      queryFn: async () => {
        const data = await fetchRepliesByThread(threadId);
        return normalizeReplies(data);
      },
      enabled: !!threadId,
    });

  return {
    replies,
    isLoading,
  };
};
