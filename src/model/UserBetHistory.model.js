// UserBetHistory


// models/UserBetHistory.model.js
import mongoose from "mongoose";

const userBetHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roundId: { type: String, required: true },
//   betAmount:{ type: Number, required: true },
  gameType: { type: String, default: "head_tail" },
//   choice: { type: String, enum: ["head", "tail"], required: true },
choice: { type: String, required: true }, 
  amount: { type: Number, required: true },
  result: { type: String, enum: ["win", "lose", "pending"], default: "pending" },
  payout: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
userBetHistorySchema.index({ userId: 1 });
userBetHistorySchema.index({ roundId: 1 });
userBetHistorySchema.index({ createdAt: -1 });

export const UserBetHistory = mongoose.model('UserBetHistory', userBetHistorySchema);