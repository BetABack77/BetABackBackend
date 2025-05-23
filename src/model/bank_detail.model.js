import mongoose, { Schema } from "mongoose";

const bankDetailSchema = new Schema(
  {
    bankName: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    user:{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  { timestamps: true }
);

export const BankDetail = mongoose.model("BankDetail", bankDetailSchema);
