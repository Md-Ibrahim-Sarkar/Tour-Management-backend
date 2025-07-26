import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";




const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: {
    public_id: (req, file) => {
      const fileName = file.originalname.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '').replace(/[^a-z0-9-]/g, '');
      const extension = file.originalname.split('.').pop();

      const unicueFileName = Math.random().toString(36).substring(2, 15) + '-' + Date.now() + '-' + fileName + '.' + extension;
      return unicueFileName;
    }
   }
})

export const multerUpload = multer({storage: storage})