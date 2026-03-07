import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createThread } from "./threadService"

export function useCreateThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createThread,

    onSuccess: (newThread) => {
      // Optimistic-like immediate cache update (no refetch needed)
      queryClient.setQueryData(["threads"], (oldThreads = []) => {
        return [newThread, ...oldThreads]
      })
    },
  })
}