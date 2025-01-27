import { asyncHandler } from "../Utils/asyncHanlder.js";
import { apiError } from "../Utils/apiError.js"
import validateEmail from "../Utils/emailValidation.js";
import { User } from "../Models/user.model.js";
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from "../Utils/cloudinary.js";
import { apiResponse } from "../Utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({
      validateBeforeSave: false
    })

    return { accessToken, refreshToken }
    
  } catch (error) {
    throw apiError(500, "Token generation failed")
  }
}

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

    if(!avatar ) throw new apiError(500, "avatar upload on cloud failed")

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

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body
  
  if (!(username || email)) throw new apiError(400, "username or email is required")
  if (!password) throw new apiError(400, "Password is required")
  
  const user = await User.findOne({
    $or: [{username},{email}]
  })

  if (!user) throw new apiError(400, "User with this username or email doesn't exists")
  
  const isPasswordValid = await user.isPasswordCorrect(password)
  
  if (!isPasswordValid) throw new apiError(400, "Password is incorrect")
  
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")
  
  const option = {
    httpOnly : true,
    secure: true
  }

  return res.status(200)
         .cookie("accessToken", accessToken, option)
         .cookie("refreshToken", refreshToken, option)
         .json(
           new apiResponse(200, "User successfully Logged IN", {
            user: LoggedInUser, accessToken, refreshToken
          })
         )
})

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $unset: {
        refreshToken : 1
      }
    },
    {
      new : true
    }
  )
  
  const option = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(201)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new apiResponse(201, "User logged out", {}));

})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!refreshToken) new apiError(401, "Unauthorized request")
  
  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id)

    if (!user) new apiError(401, "Invalid refresh token")
    
    if (refreshToken !== user.refreshToken) new apiError(401, "Refresh token expired")
    
    const { newRefreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(201)
    .cookie("refreshToken", newRefreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new apiResponse(201, "Access token Refreshed", {accessToken, refreshToken : newRefreshToken})
    )
    
  } catch (error) {
    throw new apiError(401, error.message || "Invalid refresh token")
  }
  
})

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body
  
  if(!oldPassword) throw new apiError(401 , "old password is required")
  if(!newPassword) throw new apiError(401 , "New password is required")
  if (!confirmPassword) throw new apiError(401, "Confirm password is required")
  
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) throw new apiError(401, "Incorrect password")
  
  if(newPassword !== confirmPassword) throw new apiError(401, "new password and confirmed password does not match")
  
  user.password = confirmPassword
  await user.save({
    validateBeforeSave: false
  })

  return res.status(201).json( new apiResponse(201, "Password successfully updated", {}))
  
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(201).json( new apiResponse(201, "Current user found", { user : req.user}))
})

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body
  
  if (!fullName || !email) throw new apiError(401, "All fields required")
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  if(!user) throw new apiError(501, "updation of fullName and email failed")

  return res.status(201).json( new apiResponse(201, "Details updated successfully", user))

})

const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  const fileToBeDeleted = req.user?.avatar

  if (!avatarLocalPath) throw new apiError(401, "avatar Image is required")
  
  const avatar = await uploadFileOnCloudinary(avatarLocalPath)

  if (!avatar) throw new apiError(501, "Avatar upload on cloud failed")
  
  
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar : avatar?.url
      }
    },
    {
      new : true
    }
  ).select("-password -refreshToken")

  if (!user) throw new apiError(501, "updation of avatar link in database failed")
  
  const isFileDeleted = deleteFileFromCloudinary(fileToBeDeleted)

  if(!isFileDeleted) throw new apiError(501, "Error occured while deleting the file")
  
  return res.status(200).json( new apiResponse(200, "avatar successfully updated", user))

})

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  const fileToBeDeleted = req.user?.avatar;


  if(!coverImageLocalPath) throw new apiError(401, "cover image is required")

  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath)

  if(!coverImage) throw new apiError(501, "coverImage upload on cloudinay failed")

  const user = await User.findOneAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage : coverImage?.url
      }
    },
    { new: true }
  )

  if (!user) throw new apiError(501, "updation of avatar link in database failed")
  
  const isFileDeleted = deleteFileFromCloudinary(fileToBeDeleted);

  if (!isFileDeleted) throw new apiError(501, "Error occured while deleting the file");
  
  return res.status(201).json( new apiResponse(200, "Avatar successfully updated", user))

})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatarImage,
  updateCoverImage
};