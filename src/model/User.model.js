import mongoose, { Schema } from "mongoose";
import { Otp } from "./otp.js";
import { Deposit } from "./Diposit.model.js";
import { BankDetail } from "./bank_detail.model.js";

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String, // hash this in production
    balance: { type: Number, default: 0 },
    profilePic: String,
    DepositHistory: {
      type: Schema.Types.ObjectId,
      ref: "Deposit",
    },
    Role: {
      type: String,
      enum: ["ADMIN", "USER"],
      default: "USER",
    },
    BankDetails: {
      type: Schema.Types.ObjectId,
      ref: "BankDetail",
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: String, // referralCode of the referrer
      default: null,
    },
    phoneNumber: {
      type: String,
      //  required:true
    },
    

    DateOfBirth: {
      type: Date,
    },

    bonusAmount: {
      type: Number,
      default: 0, // Amount of bonus credited (e.g., 300)
    },
    bonusPlayedAmount: {
      type: Number,
      default: 0, // How much of that bonus the user has played so far
    },

    isFirstDeposit: {
      type: Boolean,
      default: false,
    },
     lastLogin: {
      type: Date
    },
    loginCount: {
      type: Number,
      default: 0
    }

  },
  { timestamps: true }
);

// Add indexes for better query performance
userSchema.index({ username: 1 });

userSchema.index({ createdAt: -1 });
export const User = mongoose.model("User", userSchema);







// import mongoose, { Schema } from "mongoose";
// import { Otp } from "./otp.js";
// import { Deposit } from "./Diposit.model.js";
// import { BankDetail } from "./bank_detail.model.js";

// const userSchema = new mongoose.Schema(
//   {
//     username: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, trim: true },
//     password: { type: String, required: true },
//     balance: { type: Number, default: 0, min: 0 },
//     profilePic: { type: String, default: "" },
//     DepositHistory: {
//       type: Schema.Types.ObjectId,
//       ref: "Deposit",
//     },
//     Role: {
//       type: String,
//       enum: ["ADMIN", "USER"],
//       default: "USER",
//     },
//     BankDetails: {
//       type: Schema.Types.ObjectId,
//       ref: "BankDetail",
//     },
//     referralCode: {
//       type: String,
//       unique: true,
//     },
//     referredBy: {
//       type: String,
//       default: null,
//     },
//     phoneNumber: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     DateOfBirth: {
//       type: Date,
//     },
//     bonusAmount: {
//       type: Number,
//       default: 0,
//     },
//     bonusPlayedAmount: {
//       type: Number,
//       default: 0,
//     },
//     isFirstDeposit: {
//       type: Boolean,
//       default: false,
//     },
//     isActive: {
//       type: Boolean,
//       default: true
//     },
//     lastLogin: {
//       type: Date
//     },
//     loginCount: {
//       type: Number,
//       default: 0
//     }
//   },
//   { timestamps: true }
// );

// // Add indexes for better query performance
// userSchema.index({ username: 1 });

// userSchema.index({ createdAt: -1 });

// export const User = mongoose.model("User", userSchema);