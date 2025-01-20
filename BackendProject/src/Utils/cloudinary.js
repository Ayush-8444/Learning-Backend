import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("Local File Path not found");
            return null
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        if (response) {
            console.log("File succesfully uploaded ", response.url);
            return response
        }
        console.log("File upload failed");
        return null
    } catch (error) {

        console.log("cloudinary : ", error)
        
    } finally {
        
        fs.unlinkSync(localFilePath)
    }
}

export {uploadFileOnCloudinary}