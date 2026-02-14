import { databases } from "@/lib/appwrite"
import { DATABASE_ID } from "@/config/appwrite"

const collections = {
  syllabus: "syllabus",
  units: "units",
  resources: "resources",
  pyqs: "pyqs",
}

export async function getPublicStats() {
  try {
    const [syllabus, units, resources, pyqs] = await Promise.all([
      databases.listDocuments(DATABASE_ID, collections.syllabus),
      databases.listDocuments(DATABASE_ID, collections.units),
      databases.listDocuments(DATABASE_ID, collections.resources),
      databases.listDocuments(DATABASE_ID, collections.pyqs),
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
