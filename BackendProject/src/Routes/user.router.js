import { Router } from "express";
import { getChannelInformation, getCurrentUser, getUserWatchHistory } from "../Controllers/user.controller.js";
import { loginUser, logoutUser, refreshAccessToken, registerUser, } from "../Controllers/user.controller.js";
import { updatePassword, updateAvatarImage, updateUserDetails, updateCoverImage } from "../Controllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js"
import { verifyJwt } from "../Middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser)

//secured Routes
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt, updatePassword)
router.route("/current-user").get(verifyJwt, getCurrentUser)
router.route("/update-UserDetails").patch(verifyJwt, updateUserDetails)

router.route("/avatar").patch( verifyJwt, upload.single("avatar") ,updateAvatarImage)
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), updateCoverImage)

router.route("/channel/:username").get(verifyJwt, getChannelInformation)
router.route("/watchHistory").get(verifyJwt, getUserWatchHistory)


export default router