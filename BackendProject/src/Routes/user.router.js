import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, } from "../Controllers/user.controller.js";
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
router.route("/update-UserDetails").post(verifyJwt, updateUserDetails)

router.route("/avatar").post( verifyJwt, upload.single("avatar") ,updateAvatarImage)
router.route("/cover-image").post( verifyJwt, upload.single("coverImage") ,updateCoverImage)

export default router