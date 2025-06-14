import mongoose from "mongoose";
import { BankDetail } from "../model/bank_detail.model.js";
import { Deposit } from "../model/Diposit.model.js";
import { User } from "../model/User.model.js";
import { WithdrawHistory } from "../model/withdraw.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.utils.js";
import { UserBetHistory } from "../model/UserBetHistory.model.js";

export const DipositMoney = async (req, res) => {
  try {
    // console.log("hello java bro");
    const { amount, transactionId } = req.body;
    const PaymentScreenShot = req.files?.image; // Assuming you're using multer for file uploads
    // console.log("PaymentScreenShot", PaymentScreenShot);

    if (!PaymentScreenShot) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userId = req.user.id; // From middleware (auth)
    // console.log("userId", userId);

    // ✅ Validate required fields
    if (!amount || !transactionId || !PaymentScreenShot) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // put iamge into cloudinary

    const uploadedImage = await uploadInCloudinary({
      data: PaymentScreenShot.tempFilePath,
      folder: "Diposite_payment_screenshots",
      isUpload: true,
    });

    // console.log("uploadedImage", uploadedImage);

    if (!uploadedImage) {
      return res.status(500).json({ message: "Failed to upload image" });
    }
    // ✅ Save the image URL to the database
    const imageUrl = uploadedImage.secure_url; // Get the URL from the upload response
    // console.log("imageUrl", imageUrl);

    // ✅ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("payment screenshot", PaymentScreenShot);
    // ✅ Create new deposit document
    const newDeposit = new Deposit({
      amount,
      user: userId,
      transactionId,
      paymentScreenshot: imageUrl,
      status: "PENDING",
    });

    const savedDeposit = await newDeposit.save();

    // ✅ Optional: Update user's latest deposit history reference
    user.DepositHistory = savedDeposit._id;
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted",
      data: savedDeposit,
    });
  } catch (error) {
    console.error("Deposit Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserDeposits = async (req, res) => {
  try {
    const { userId } = req.params;

    const deposits = await Deposit.find({ user: userId }).sort({
      createdAt: -1,
    });

    if (!deposits.length) {
      return res
        .status(404)
        .json({ success: false, message: "No deposits found for this user." });
    }

    return res.status(200).json({
      success: true,
      message: "Deposits fetched successfully",
      data: deposits,
    });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const withdrawMoney = async (req, res) => {
  try {
    const { amount, transactionId } = req.body;

    const userId = req.user.id;

    if (!amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (amount < 100) {
      return res
        .status(400)
        .json({ success: false, message: "Minimum withdraw amount is 100" });
    }
    // ✅ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // remove the amount from user balance
    user.balance -= amount;
    await user.save();

    // ✅ Create new withdraw document
    const newWithdraw = new WithdrawHistory({
      amount,
      user: userId,
      transactionId,
      // paymentScreenshot: imageUrl,
      status: "PENDING",
    });
    // ✅ Save the withdraw document
    const savedWithdraw = await newWithdraw.save();

    if (!savedWithdraw) {
      return res.status(500).json({
        success: false,
        message: "Failed to create withdraw request",
      });
    }
    // return success response
    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted",
      data: savedWithdraw,
    });
  } catch (error) {
    console.log("Withdraw Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const SaveUserBankDetails = async (req, res) => {
  try {
    const { bankName, accountHolderName, accountNumber, ifscCode } = req.body;

    const userId = req.user.id; // From middleware (auth)
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // console.log("bankName", bankName);
    // console.log("accountHolderName", accountHolderName);
    // console.log("accountNumber", accountNumber);
    // console.log("ifscCode", ifscCode);
    // console.log("userId", userId);

    // Validate required fields
    if (!bankName || !accountHolderName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Create and save new bank detail
    const newBankDetail = new BankDetail({
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      user: userId,
    });

    const savedBankDetail = await newBankDetail.save();

    // console.log("savedBankDetail", savedBankDetail);

    const updatedUserData = await User.findByIdAndUpdate(
      userId,
      { BankDetails: savedBankDetail._id },
      { new: true }
    );

    if (!updatedUserData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Bank details saved successfully",
      data: savedBankDetail,
    });
  } catch (error) {
    console.error("Error saving bank details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserBankDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Fetch bank details for the user
    const bankDetails = await BankDetail.findOne({ user: userId });
    // console.log("bankDetails", bankDetails);
    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: "Bank details not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bank details fetched successfully",
      data: bankDetails,
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserWithdrawHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Fetch withdraw history for the user
    const withdrawHistory = await WithdrawHistory.find({ user: userId }).sort({
      createdAt: -1,
    });

    if (!withdrawHistory.length) {
      return res.status(404).json({
        success: false,
        message: "Withdraw history not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Withdraw history fetched successfully",
      data: withdrawHistory,
    });
  } catch (error) {
    console.error("Error fetching withdraw history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserBalance = async (req, res) => {
  try {
    const userId = req.user.id; // From middleware (auth)

    // ✅ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Return user's balance
    return res.status(200).json({
      success: true,
      message: "User balance fetched successfully",
      data: { balance: user.balance },
    });
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserBonus = async (req, res) => {
  try {
    const userId = req.user.id; // From middleware (auth)

    // ✅ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Return user's bonus
    return res.status(200).json({
      success: true,
      message: "User bonus fetched successfully",
      data: { bonusAmount: user.bonusAmount },
    });
  } catch (error) {
    console.error("Error fetching user bonus:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserBetHistoryHeadTail = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await UserBetHistory.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({
      success: true,
      status: 200,
      message: "Bet history fetched successfully",
      data: history,
    });
  } catch (error) {
    // console.log("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// controllers/betHistory.controller.js

export const getUserBetHistoryByGameType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameType } = req.params; // or req.query if you prefer query params

    const history = await UserBetHistory.find({
      userId: userId,
      gameType: gameType,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      status: 200,
      message: "Bet history fetched successfully",
      data: history,
    });
  } catch (error) {
    // console.log("Error fetching history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch history",
    });
  }
};
