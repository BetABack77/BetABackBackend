import mongoose, { Schema } from "mongoose";

const withdrawSchema = new Schema(
  {
    amount: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    transactionId: { type: String},
    // paymentScreenshot: { type: String, required: true },
  },
  { timestamps: true }
);

export const WithdrawHistory = mongoose.model(
  "Withdraw",
  withdrawSchema
);
