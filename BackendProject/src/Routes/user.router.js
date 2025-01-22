import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../Controllers/user.controller.js";
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
router.route("/logout").post(verifyJwt ,logoutUser)

export default router