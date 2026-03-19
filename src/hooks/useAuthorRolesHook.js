// src/hooks/useAuthorRoles.js
import { useEffect, useRef, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COL   = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;

// Map shape: { [authorId]: { role, avatarUrl, username } }
export default function useAuthorRoles(replies) {
  const [authorRoles, setAuthorRoles] = useState({});
  const fetchedKeyRef = useRef("");

  useEffect(() => {
    if (!replies?.byId) return;

    const authorIds = [
      ...new Set(
        Object.values(replies.byId)
          .map((r) => r?.authorId)
          .filter(Boolean),
      ),
    ].sort();

    if (authorIds.length === 0) return;

    const key = authorIds.join(",");
    if (key === fetchedKeyRef.current) return;
    fetchedKeyRef.current = key;

    let cancelled = false;

    (async () => {
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

        // Request 2: fallback by $id
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

      if (cancelled) return;
      setAuthorRoles((prev) => {
        const prevKey = JSON.stringify(prev);
        const nextKey = JSON.stringify(map);
        return prevKey === nextKey ? prev : map;
      });
    })();

    return () => { cancelled = true; };
  }, [replies?.byId]);

  return authorRoles;
}