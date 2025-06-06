import { Deposit } from "../model/Diposit.model.js";

import { WithdrawHistory } from "../model/withdraw.model.js";

import { User } from "../model/User.model.js";
import { BankDetail } from "../model/bank_detail.model.js";
import { UserBetHistory } from "../model/UserBetHistory.model.js";

export const verifyDeposit = async (req, res) => {
  try {
    const { userId, depositId } = req.body;

    // Step 1: Find the deposit
    const deposit = await Deposit.findOne({ _id: depositId, user: userId });
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    if (deposit.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Deposit already verified",
      });
    }

    // Step 2: Update deposit status
    deposit.status = "APPROVED";
    await deposit.save();

    // Step 3: Update user's balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 4: Calculate 5% bonus
    const fivePercentBonus = deposit.amount * 0.05;
    user.balance += deposit.amount + fivePercentBonus;
    user.bonusAmount += fivePercentBonus;
    user.bonusAmount += deposit.amount; // Add the deposit amount to bonusAmount as well

    // Step 5: Check if this is the user's FIRST approved deposit
    const approvedDeposits = await Deposit.find({
      user: userId,
      status: "APPROVED",
    });

    const isFirstDeposit = approvedDeposits.length === 1; // Because we just approved it above

    // Step 6: Referral Bonus (₹50 each) if it's the first deposit
    let referredByUser = null;
    if (isFirstDeposit && user.referredBy) {
      referredByUser = await User.findOne({
        referralCode: user.referredBy,
      });

      if (referredByUser) {
        // Give ₹50 to the referred user (new user)
        user.balance += 50;
        user.bonusAmount += 50;

        // Give ₹50 to the referrer
        referredByUser.balance += 50;
        referredByUser.bonusAmount += 50;

        await referredByUser.save();
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Deposit verified and balance updated",
      referralBonusGiven: isFirstDeposit && referredByUser ? true : false,
    });
  } catch (error) {
    console.error("Error verifying deposit:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllPendingDeposits = async (req, res) => {
  try {
    const pendingDeposits = await Deposit.find({ status: "PENDING" })
      .populate("user", "username email profilePic") // Populate user info (optional)
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      message: "All pending deposits fetched successfully",
      data: pendingDeposits,
    });
  } catch (error) {
    console.error("Error fetching pending deposits:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching pending deposits",
    });
  }
};

export const updateDepositStatus = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { status } = req.body;

    // ✅ Validate status
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // ✅ Find and update deposit
    const updatedDeposit = await Deposit.findByIdAndUpdate(
      depositId,
      { status },
      { new: true }
    ).populate("user", "username email profilePic"); // Optional: populate user info

    if (!updatedDeposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Deposit ${status.toLowerCase()} successfully`,
      data: updatedDeposit,
    });
  } catch (error) {
    console.error("Update deposit status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPendingWithdraws = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from the request
    // const pendingWithdraws = await WithdrawHistory.find({
    //   status: "PENDING",
    // })
    //   .populate("user")
    //   .exec();

    const pendingWithdraws = await WithdrawHistory.find({
      status: "PENDING",
    }).populate({
      path: "user",
      populate: {
        path: "BankDetails",
        model: "BankDetail", // This must match your model name exactly
      },
    });
    return res.status(200).json({
      success: true,
      message: "Pending withdraws fetched",

      data: pendingWithdraws,
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const verfyWithdraw = async (req, res) => {
  try {
    const { userId, withdrawId } = req.body;

    const withdraw = await WithdrawHistory.findOne({
      _id: withdrawId,
      user: userId,
    });

    // console.log("withdraw", withdraw);
    if (!withdraw) {
      return res
        .status(404)
        .json({ success: false, message: "Withdraw request not found" });
    }

    if (withdraw.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Withdraw already processed" });
    }

    // Deduct balance now
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // if (user.balance < withdraw.amount) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Insufficient balance at verification",
    //   });
    // }
    withdraw.status = "APPROVED";
    await withdraw.save();

    res.status(200).json({
      success: true,
      message: "Withdraw verified and balance deducted",
      data: withdraw,
    });
  } catch (error) {
    console.error("Error verifying withdraw:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const rejectWithdraw = async (req, res) => {
  try {
    const { userId, withdrawId } = req.body;

    const withdraw = await WithdrawHistory.findOne({
      _id: withdrawId,
      user: userId,
    });
    if (!withdraw) {
      return res
        .status(404)
        .json({ success: false, message: "Withdraw not found" });
    }

    if (withdraw.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Withdraw already processed" });
    }

    withdraw.status = "REJECTED";
    await withdraw.save();

    // Refund the amount back to user's balance
    const user = await User.findById(userId);
    if (user) {
      user.balance += withdraw.amount;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Withdraw request rejected and amount refunded",
    });
  } catch (error) {
    console.error("Reject withdraw error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllWithdrawHistory = async (req, res) => {
  try {
    const withdrawHistory = await WithdrawHistory.find()
      .populate("user", "username email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All withdraw history fetched successfully",
      data: withdrawHistory,
    });
  } catch (error) {
    console.error("Error fetching withdraw history:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching withdraw history",
    });
  }
};

export const getAllDepositHistory = async (req, res) => {
  try {
    const depositHistory = await Deposit.find()
      .populate("user", "username email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All deposit history fetched successfully",
      data: depositHistory,
    });
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching deposit history",
    });
  }
};

export const getAllApprovedDeposits = async (req, res) => {
  try {
    const approvedDeposits = await Deposit.find({ status: "APPROVED" })
      .populate("user", "username email profilePic") // Populate user info (optional)
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      message: "All approved deposits fetched successfully",
      data: approvedDeposits,
    });
  } catch (error) {
    console.error("Error fetching approved deposits:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching approved deposits",
    });
  }
};

export const getAllApprovedWithdraws = async (req, res) => {
  try {
    const approvedWithdraws = await WithdrawHistory.find({ status: "APPROVED" })
      .populate({
        path: "user",
        populate: {
          path: "BankDetails",
          model: "BankDetail", // This must match your model name exactly
        },
      }) // Populate bank details (optional)

      // Populate user info (optional)
      .sort({ createdAt: -1 })
      .exec(); // Newest first

    res.status(200).json({
      success: true,
      message: "All approved withdraws fetched successfully",
      data: approvedWithdraws,
    });
  } catch (error) {
    console.error("Error fetching approved withdraws:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching approved withdraws",
    });
  }
};

export const rejectDeposit = async (req, res) => {
  try {
    const { userId, depositId } = req.body;

    const deposit = await Deposit.findOne({
      _id: depositId,
      user: userId,
    });

    if (!deposit) {
      return res
        .status(404)
        .json({ success: false, message: "Deposit not found" });
    }

    if (deposit.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Deposit already processed" });
    }

    deposit.status = "REJECTED";
    await deposit.save();

    res.status(200).json({
      success: true,
      message: "Deposit request rejected successfully",
    });
  } catch (error) {
    console.error("Reject deposit error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const totalDeposits = await Deposit.aggregate([
      { $match: { status: "APPROVED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalWithdrawals = await WithdrawHistory.aggregate([
      { $match: { status: "APPROVED" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const pendingDepositsCount = await Deposit.countDocuments({
      status: "PENDING",
    });
    const pendingWithdrawalsCount = await WithdrawHistory.countDocuments({
      status: "PENDING",
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalDeposits: totalDeposits[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        pendingDepositsCount,
        pendingWithdrawalsCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// // Search users
// export const searchUsers = async (req, res) => {
//   try {
//     const { query } = req.query;

//     if (!query) {
//       return res.status(400).json({
//         success: false,
//         message: "Search query is required"
//       });
//     }

//     const users = await User.find({
//       $or: [
//         { username: { $regex: query, $options: 'i' } },
//         { email: { $regex: query, $options: 'i' } },
//         { phoneNumber: { $regex: query, $options: 'i' } },
//         { _id: query }
//       ]
//     }).select('-password');

//     res.status(200).json({
//       success: true,
//       data: users
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to search users",
//       error: error.message
//     });
//   }
// };

import mongoose from "mongoose"; // Make sure this is imported

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const conditions = [
      { username: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phoneNumber: { $regex: query, $options: "i" } },
    ];

    // Add _id search only if query is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(query)) {
      conditions.push({ _id: query });
    }

    const users = await User.find({
      $or: conditions,
    }).select("-password");

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: error.message,
    });
  }
};

// Get user details with full history
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all related data
    const [deposits, withdrawals, gameHistory, bankDetails] = await Promise.all(
      [
        Deposit.find({ user: userId }).sort({ createdAt: -1 }),
        WithdrawHistory.find({ user: userId }).sort({ createdAt: -1 }),
        UserBetHistory.find({ user: userId }).sort({ createdAt: -1 }),
        BankDetail.find({ user: userId }),
      ]
    );

    console.log("games History", gameHistory);

    res.status(200).json({
      success: true,
      data: {
        user,
        deposits,
        withdrawals,
        gameHistory,
        bankDetails: bankDetails[0] || null,
      },
    });
  } catch (error) {
    console.log("erro is in userDetail", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: error.message,
    });
  }
};
