import { databases, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { deleteCloudinaryImage } from "@/lib/deleteCloudinaryImage";

const DATABASE_ID  = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const THREADS_COL  = import.meta.env.VITE_APPWRITE_THREADS_COLLECTION_ID;
const REPLIES_COL  = import.meta.env.VITE_APPWRITE_REPLIES_COLLECTION_ID;

export async function createThread({ title, content, universityId, courseId, branchId, authorId, authorName }) {
  return await databases.createDocument(DATABASE_ID, THREADS_COL, ID.unique(), {
    title, content, universityId, courseId, branchId, authorId, authorName,
    repliesCount: 0, isPinned: false, isLocked: false,
  });
}

export async function fetchThreads() {
  const response = await databases.listDocuments(DATABASE_ID, THREADS_COL, [
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
  return response.documents;
}

export const fetchThreadById = async (threadId) => {
  return await databases.getDocument(DATABASE_ID, THREADS_COL, threadId);
};

// ── Increment repliesCount when a reply is created ───────────────────────────
export async function incrementRepliesCount(threadId) {
  const thread = await databases.getDocument(DATABASE_ID, THREADS_COL, threadId);
  return await databases.updateDocument(DATABASE_ID, THREADS_COL, threadId, {
    repliesCount: (thread.repliesCount ?? 0) + 1,
  });
}

// ── Decrement repliesCount when a reply is deleted ───────────────────────────
export async function decrementRepliesCount(threadId) {
  const thread = await databases.getDocument(DATABASE_ID, THREADS_COL, threadId);
  return await databases.updateDocument(DATABASE_ID, THREADS_COL, threadId, {
    repliesCount: Math.max(0, (thread.repliesCount ?? 1) - 1),
  });
}

// ── Delete thread + all replies ───────────────────────────────────────────────
// Order:
//   1. Fetch all replies (id + imagePublicId) in cursor-paginated batches — no extra requests
//   2. Fire all Cloudinary deletes in parallel (swallow errors — best effort)
//   3. Delete Appwrite reply documents in batches of 20
//   4. Delete the thread document itself
export async function deleteThread(threadId) {
  // 1. Fetch reply IDs + imagePublicIds in one pass (no Query.select — full doc needed)
  let cursor = null;
  const replies = []; // [{ id, imagePublicId }]

  while (true) {
    const queries = [
      Query.equal("threadId", threadId),
      Query.limit(100),
      Query.select(["$id", "imagePublicId"]), // only 2 fields — minimal payload
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const res = await databases.listDocuments(DATABASE_ID, REPLIES_COL, queries);
    for (const doc of res.documents) {
      replies.push({ id: doc.$id, imagePublicId: doc.imagePublicId ?? null });
    }
    if (res.documents.length < 100) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }

  // 2. Delete all Cloudinary images in parallel — fire-and-forget, never blocks deletion
  const publicIds = replies.map(r => r.imagePublicId).filter(Boolean);
  await Promise.allSettled(publicIds.map(pid => deleteCloudinaryImage(pid)));

  // 3. Delete Appwrite reply documents in batches of 20
  const replyIds = replies.map(r => r.id);
  for (let i = 0; i < replyIds.length; i += 20) {
    const batch = replyIds.slice(i, i + 20);
    await Promise.allSettled(
      batch.map(id => databases.deleteDocument(DATABASE_ID, REPLIES_COL, id))
    );
  }

  // 4. Delete the thread — throws if it fails so caller knows
  await databases.deleteDocument(DATABASE_ID, THREADS_COL, threadId);
}