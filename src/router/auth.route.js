import { Router } from "express";

import { authentication } from "../middleware/authantication.js";
import {
  changePassword,
  generateOtp,
  Login,
  ResetPassword,
  Signup,
} from "../controller/auth.controller.js";
const authRoute = Router();

authRoute.post("/signup", Signup);
authRoute.post("/generate-otp", generateOtp);
authRoute.post("/login", Login);

authRoute.post("/change-password", authentication, changePassword);
authRoute.post("/reset-password", ResetPassword);

export default authRoute;
