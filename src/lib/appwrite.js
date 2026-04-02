import { Client, Account, Databases, Storage, Functions, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);   // ✅ ADD THIS

export { ID, Query };

export default client;

export const CLASSES_COLLECTION_ID        = import.meta.env.VITE_APPWRITE_CLASSES_COLLECTION_ID
export const ENROLLMENTS_COLLECTION_ID    = import.meta.env.VITE_APPWRITE_ENROLLMENTS_COLLECTION_ID
export const SESSIONS_COLLECTION_ID       = import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID
export const ATTENDANCE_RECORDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ATTENDANCE_RECORDS_COLLECTION_ID