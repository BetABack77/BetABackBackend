import mongoose, { Schema } from "mongoose";
const depositSchema = new Schema(
  {
    amount: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    transactionId: { type: String, required: true },
    paymentScreenshot: { type: String, required: true },
  },
  { timestamps: true }
);
export const Deposit = mongoose.model("Deposit", depositSchema);
