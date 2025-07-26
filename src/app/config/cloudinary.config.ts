import { v2 as cloudinary } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/AppError";



cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
})


export const deleteCloudinaryImage = async (url: string) => { 
  try {
    const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;
    const match = url.match(regex);
    if (!match) {
      throw new Error('Invalid Cloudinary URL');
    }
    const publicId = match[1];
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    throw new AppError(500, "Failed to delete image from Cloudinary");
  }
}

export const cloudinaryUpload = cloudinary
