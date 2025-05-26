import { Schema } from "mongoose";
import mongoose from "mongoose";

import { sendMail } from "../utils/sendMail.js";
import { generateOtpTemplate } from "../templets/sentOtpTemplets.js";

// const otpSchema = new Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//     },
//     otp: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true, expiresIn: "5m" }
// );

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 300 seconds = 5 minutes
  },
});

otpSchema.pre("save", async function genrateOtp() {
  const usename = this.email.split("@")[0];
  console.log("username is ", usename);
  const htmlContent = generateOtpTemplate(usename, this.otp);
  const response = await sendMail(this.email, "OTP", htmlContent);
  console.log("response is ", response);
  console.log("otp is ", this.otp);
});

export const Otp = mongoose.model("Otp", otpSchema);
