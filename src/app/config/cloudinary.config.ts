import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/AppError";
import Stream from "stream";



cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
})


export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadApiResponse | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      const public_id = `pdf/${fileName}-${Date.now()}`;

      const bufferStream = new Stream.PassThrough();
      bufferStream.end(buffer); 

      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            public_id: public_id,
            folder: 'pdf',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(buffer);
    });
  } catch (error: any) {
    console.log(error);
    throw new AppError(401, `Error uploading file ${error.message}`);
  }
};



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
    console.log(error);
    
    throw new AppError(500, "Failed to delete image from Cloudinary");
  }
}

export const cloudinaryUpload = cloudinary
