import { v2 as cloudinary } from "cloudinary";

export default async ({ req, res, log, error }) => {

  try {

    const body = JSON.parse(req.body || "{}");
    const { publicId } = body;

    if (!publicId) {
      return res.json({ error: "publicId missing" }, 400);
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await cloudinary.uploader.destroy(publicId);

    log(`Deleted image: ${publicId}`);

    return res.json({
      success: true,
      result
    });

  } catch (err) {

    error("Cloudinary delete failed: " + err.message);

    return res.json({
      success: false,
      error: err.message
    }, 500);

  }
};