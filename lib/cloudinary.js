import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a base64 data URI or remote URL to Cloudinary under a school-specific folder.
 * folder examples: "toppers", "events", "students", "staff"
 */
export async function uploadToCloudinary(fileDataUri, folder = "misc") {
  const result = await cloudinary.uploader.upload(fileDataUri, {
    folder: `xyz-school/${folder}`,
    resource_type: "auto",
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  };
}

export async function deleteFromCloudinary(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default cloudinary;
