// src/hooks/useAuthorRolesHook.js
import { useQuery } from "@tanstack/react-query";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COL   = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

// Map shape: { [authorId]: { role, avatarUrl, username } }
export default function useAuthorRoles(replies) {
  const authorIds = replies?.byId
    ? [...new Set(
        Object.values(replies.byId)
          .map((r) => r?.authorId)
          .filter(Boolean),
      )].sort()
    : [];

  const { data: authorRoles = {} } = useQuery({
    queryKey: ["author-roles", ...authorIds],
    queryFn: async () => {
      const map = {};

      try {
        // Request 1: batch by userId
        const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
          Query.equal("userId", authorIds),
          Query.limit(500),
          Query.select(["userId", "$id", "role", "avatarUrl", "username"]),
        ]);

        const foundUserIds = new Set();
        for (const doc of res.documents) {
          map[doc.userId] = {
            role:      doc.role,
            avatarUrl: doc.avatarUrl ?? null,
            username:  doc.username  ?? null,
          };
          foundUserIds.add(doc.userId);
        }

        // Request 2: fallback by $id for any unresolved ids
        const unresolved = authorIds.filter((id) => !foundUserIds.has(id));
        if (unresolved.length > 0) {
          const res2 = await databases.listDocuments(DATABASE_ID, USERS_COL, [
            Query.equal("$id", unresolved),
            Query.limit(500),
            Query.select(["$id", "role", "avatarUrl", "username"]),
          ]);
          for (const doc of res2.documents) {
            map[doc.$id] = {
              role:      doc.role,
              avatarUrl: doc.avatarUrl ?? null,
              username:  doc.username  ?? null,
            };
          }
        }
      } catch (err) {
        console.error("Failed to batch fetch author roles:", err);
      }

      return map;
    },
    enabled: authorIds.length > 0,
    staleTime: 1000 * 60 * 10,  // 10 min — same as user-avatar queries
    retry: false,
  });

  return authorRoles;
}