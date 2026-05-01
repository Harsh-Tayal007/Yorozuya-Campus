import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import {
  DATABASE_ID,
  SYLLABUS_COLLECTION_ID,
  UNITS_COLLECTION_ID,
  RESOURCES_COLLECTION_ID,
  PYQS_COLLECTION_ID
} from "@/config/appwrite"

export async function getPublicStats() {
  try {
    const [syllabus, units, resources, pyqs] = await Promise.all([
      databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION_ID, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID, [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, [Query.limit(1)]),
    ])

    return {
      syllabus: syllabus.total,
      units: units.total,
      resources: resources.total,
      pyqs: pyqs.total,
    }
  } catch (error) {
    console.error("Failed to fetch public stats", error)
    return {
      syllabus: 0,
      units: 0,
      resources: 0,
      pyqs: 0,
    }
  }
}
