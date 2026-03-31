// src/services/updateLogsService.js
import { databases, ID } from "@/lib/appwrite"
import { Query } from "appwrite"

const DB   = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COL  = import.meta.env.VITE_APPWRITE_UPDATE_LOGS_COLLECTION_ID

export const updateLogsService = {
  list: (onlyPublished = false) => {
    const queries = [Query.orderDesc("publishedAt"), Query.limit(50)]
    if (onlyPublished) queries.push(Query.equal("isPublished", true))
    return databases.listDocuments(DB, COL, queries)
  },

  create: (data) =>
    databases.createDocument(DB, COL, ID.unique(), data),

  update: (id, data) =>
    databases.updateDocument(DB, COL, id, data),

  delete: (id) =>
    databases.deleteDocument(DB, COL, id),
}