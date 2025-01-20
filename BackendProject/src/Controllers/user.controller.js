import { asyncHandler } from "../Utils/asyncHanlder.js";
import { apiError } from "../Utils/apiError.js"
import validateEmail from "../Utils/emailValidation.js";
import { User } from "../Models/user.model.js";
import { uploadFileOnCloudinary } from "../Utils/cloudinary.js";
import { apiResponse } from "../Utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body
    
  if (email === "") throw new apiError(400, "email is required");
  if (username === "") throw new apiError(400, "username is required");
  if (fullName === "") throw new apiError(400, "fullName is required");
  if (password === "") throw new apiError(400, "password is required");

  if (!validateEmail(email)) throw new apiError(400, "Enter correct email")
    
  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existingUser) throw new apiError(409, "user already exits for this username or password")

    
  let avatarLocalPath;
  if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
    avatarLocalPath = req.files.avatar[0].path
  }
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }
        
    
    if (!avatarLocalPath) throw new apiError(400, "Avatar image is required")
    
    const avatar = await uploadFileOnCloudinary(avatarLocalPath)
    const coverImage = (coverImageLocalPath) ? await uploadFileOnCloudinary(coverImageLocalPath) : null;

    if(!avatar ) throw new apiError(500, "avatar upload on cloudinary failed")

    const user = await User.create({
        username : username.toLowerCase( ),
        password,
        fullName,
        email,
        avatar : avatar.url,
        coverImage : coverImage?.url || "" 
    })

    const createdUser = await User.findById(user._id)?.select(
      "-password -refreshToken"
    );
    
    if (!createdUser) throw new apiError(500, "Error occured while registering a user ")
    
    return res.status(201).json(
        new apiResponse(201, "user Registered successfully", createdUser)
    )
})


export {registerUser}