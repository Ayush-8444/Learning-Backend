import { asyncHandler } from "../Utils/asyncHanlder.js";
import { apiError } from "../Utils/apiError.js"
import validateEmail from "../Utils/emailValidation.js";
import { User } from "../Models/user.model.js";
import { uploadFileOnCloudinary } from "../Utils/cloudinary.js";
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

export {registerUser, loginUser, logoutUser, refreshAccessToken}