import { databases } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const REPLIES_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_REPLIES_COLLECTION_ID;
const VOTES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_VOTES_COLLECTION_ID;

export const fetchRepliesByThread = async (threadId) => {
  const response = await databases.listDocuments(
    DATABASE_ID,
    REPLIES_COLLECTION_ID,
    [
      Query.equal("threadId", threadId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
  );

  return response.documents;
};

export const createReply = async ({
  threadId,
  content,
  gifUrl = null,
  imageUrl = null,
  imagePublicId = null,
  authorId,
  authorName,
  parentReplyId = null,
}) => {
  if (!content && !gifUrl && !imageUrl) {
    throw new Error("Reply cannot be empty");
  }

  const res = await databases.createDocument(
    DATABASE_ID,
    REPLIES_COLLECTION_ID,
    ID.unique(),
    {
      threadId,
      content,
      gifUrl,
      imageUrl,
      imagePublicId,
      authorId,
      authorName,
      parentReplyId,
      upvotes: 1, // ← default +1
      isPinned: false,
    },
  );

  // Auto-upvote by the author (like Reddit)
  await databases.createDocument(
    DATABASE_ID,
    VOTES_COLLECTION_ID,
    ID.unique(),
    { replyId: res.$id, userId: authorId, vote: "up" },
  );

  return res;
};

// Soft delete — keeps the document but marks it deleted (used when reply has children)
export async function deleteReply(replyId, modDeleted = false) {
  return databases.updateDocument(DATABASE_ID, REPLIES_COLLECTION_ID, replyId, {
    content: modDeleted ? "[deleted by mods]" : "[deleted]",
    deleted: true,
    modDeleted: modDeleted,   // ← add this field to your Appwrite collection too
    gifUrl: null,
    imageUrl: null,
    imagePublicId: null,
  })
}

// Hard delete — completely removes the document (used when reply has no children)
export const hardDeleteReply = async (replyId) => {
  await databases.deleteDocument(DATABASE_ID, REPLIES_COLLECTION_ID, replyId);
  return replyId;
};

export const updateReply = async ({
  id,
  content,
  gifUrl = null,
  imageUrl = null,
}) => {
  if (!content && !gifUrl && !imageUrl) {
    throw new Error("Reply cannot be empty");
  }

  const res = await databases.updateDocument(
    DATABASE_ID,
    REPLIES_COLLECTION_ID,
    id,
    {
      content,
      gifUrl,
      imageUrl,
    },
  );

  return res;
};

// ── Add to bottom of replyService.js ─────────────────────────────────────────

const THREADS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_THREADS_COLLECTION_ID;

export const pinReply = async (replyId, threadId, currentPinnedReplyId) => {
  if (currentPinnedReplyId && currentPinnedReplyId !== replyId) {
    await databases.updateDocument(
      DATABASE_ID,
      REPLIES_COLLECTION_ID,
      currentPinnedReplyId,
      {
        isPinned: false,
      },
    );
  }

  await databases.updateDocument(DATABASE_ID, REPLIES_COLLECTION_ID, replyId, {
    isPinned: true,
  });

  await databases.updateDocument(DATABASE_ID, THREADS_COLLECTION_ID, threadId, {
    pinnedReplyId: replyId,
  });
};

export const unpinReply = async (replyId, threadId) => {
  await databases.updateDocument(DATABASE_ID, REPLIES_COLLECTION_ID, replyId, {
    isPinned: false,
  });

  await databases.updateDocument(DATABASE_ID, THREADS_COLLECTION_ID, threadId, {
    pinnedReplyId: null,
  });
};
