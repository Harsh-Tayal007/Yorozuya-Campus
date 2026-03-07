import { databases, ID } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const THREADS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_THREADS_COLLECTION_ID;

export async function createThread({
  title,
  content,
  universityId,
  courseId,
  branchId,
  authorId,
  authorName,
}) {
  const newThread = await databases.createDocument(
    DATABASE_ID,
    THREADS_COLLECTION_ID,
    ID.unique(),
    {
      title,
      content,
      universityId,
      courseId,
      branchId,
      authorId,
      authorName,
      repliesCount: 0,
      isPinned: false,
      isLocked: false,
    },
  );

  return newThread;
}

export async function fetchThreads() {
  const response = await databases.listDocuments(
    DATABASE_ID,
    THREADS_COLLECTION_ID,
    [Query.orderDesc("$createdAt"), Query.limit(100)],
  );

  return response.documents;
}

export const fetchThreadById = async (threadId) => {
  return await databases.getDocument(
    import.meta.env.VITE_APPWRITE_DATABASE_ID,
    import.meta.env.VITE_APPWRITE_THREADS_COLLECTION_ID,
    threadId
  )
}