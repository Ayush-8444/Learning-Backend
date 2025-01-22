import { apiError } from "../Utils/apiError.js";
import { asyncHandler } from "../Utils/asyncHanlder.js";
import jwt from "jsonwebtoken"
import { User } from "../Models/user.model.js";


export const verifyJwt = asyncHandler(async (req, res, next) => {

    try {
        const Token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer ", "")
        
        if (!Token) throw new apiError(401, "Unauthorized user")
        
        const decodedToken = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user) throw new apiError(401,"Invalid access token")
    
        req.user = user
        next()
    } catch (error) {
        throw new apiError(401, error?.message || "invalid access token")
    }
})