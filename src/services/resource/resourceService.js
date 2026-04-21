// services/resourceService.js
import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";
import {
  DATABASE_ID,
  RESOURCES_COLLECTION_ID,
  ACTIVITIES_COLLECTION_ID,
} from "@/config/appwrite";
import { uploadFile as adapterUpload, deleteFile as adapterDelete } from "@/services/shared/storageAdapter";

/**
 * CREATE resource
 */
export async function createResource(data, currentUser) {
  const {
    programId,
    semester,
    branch,
    subjectId,
    unitId,
    title,
    description,
    resourceType,
    file,
    url,
  } = data;

  let fileId = null;
  let resourceUrl = null;
  let storageProvider = "appwrite";

  if (resourceType === "link") {
    if (!url) throw new Error("URL is required");
    resourceUrl = url;
  } else {
    if (!file) throw new Error("File is required");

    const uploadResult = await adapterUpload(file, "resource");
    fileId = uploadResult.fileId;
    storageProvider = uploadResult.storageProvider;
  }

  const resource = await databases.createDocument(
    DATABASE_ID,
    RESOURCES_COLLECTION_ID,
    ID.unique(),
    {
      title,
      description,
      type: resourceType,
      programId,
      semester,
      branch,
      subjectId,
      unitId,
      fileId,
      storageProvider,
      url: resourceUrl,
      isPublic: true,
      status: "published",
    }
  );

  await logActivity(currentUser, "created", resource.title);
  return resource;
}

/**
 * UPDATE resource (optional file replacement)
 */
export async function updateResource(id, data, currentUser) {
  const updated = await databases.updateDocument(
    DATABASE_ID,
    RESOURCES_COLLECTION_ID,
    id,
    data
  );

  await logActivity(currentUser, "edited", updated.title);
  return updated;
}

/**
 * DELETE resource
 */
export async function deleteResource(resource, currentUser) {
  const { $id, type, fileId, title } = resource;

  if (type !== "link" && fileId) {
    try {
      await adapterDelete(fileId, resource.storageProvider, "resource");
    } catch {
      // ignore file delete failure
    }
  }

  await databases.deleteDocument(
    DATABASE_ID,
    RESOURCES_COLLECTION_ID,
    $id
  );

  await logActivity(currentUser, "deleted", title);
}

/* -------- helper -------- */
const logActivity = async (actor, action, entityName) => {
  return databases.createDocument(
    DATABASE_ID,
    ACTIVITIES_COLLECTION_ID,
    ID.unique(),
    {
      actorId: actor.$id,
      actorName: actor.name,
      action,
      entityType: "Resource",
      entityName,
    }
  );
};
