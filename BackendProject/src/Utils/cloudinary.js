import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

function extractPublicId(url) {
  const parts = url.split("/");
  // Get the last part (e.g., "cr4mxeqx5zb8rlakpfkg.jpg")
    const fileName = parts[parts.length - 1];
    // Remove the file extension
    const publicId = fileName.split(".")[0];
    // Return only the unique identifier
    return publicId;
}

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

const deleteFileFromCloudinary = async (cloudinaryUrl) => {
    
    try {
        if (!cloudinaryUrl) {
            console.log("cloudinary url not found")
            return null
        }
    
        const publicId = extractPublicId(cloudinaryUrl)
    
        const result = await cloudinary.uploader.destroy(publicId)
    
        if (result.result === "ok") {
            console.log("File deleted successfully");
            return true
        }
        return false
    } catch (error) {
        console.log("cloudinary : ", error);

    }

}

export { uploadFileOnCloudinary, deleteFileFromCloudinary };