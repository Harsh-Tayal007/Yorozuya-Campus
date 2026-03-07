import { functions } from "@/lib/appwrite";

const CLOUDINARY_FN_ID = "69abd1b6003368be1e41"

export async function deleteCloudinaryImage(publicId) {
  if (!publicId) return;

  try {
    const result = await functions.createExecution(
      CLOUDINARY_FN_ID,
      JSON.stringify({ publicId })
    );

    console.log("Cloudinary image deleted:", publicId, result);
  } catch (err) {
    console.error("Cloudinary delete failed:", err);
  }
}
