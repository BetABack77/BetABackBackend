import { Router } from "express";
import { authentication } from "../middleware/authantication.js";
import { IsAdmin } from "../middleware/authantication.js";
import {
  getAllApprovedDeposits,
  getAllApprovedWithdraws,
  getAllDepositHistory,
  getAllPendingDeposits,
  getAllPendingWithdraws,
  getAllUsers,
  getAllWithdrawHistory,
  getDashboardStats,
  getUserDetails,
  rejectDeposit,
  rejectWithdraw,
  searchUsers,
  updateDepositStatus,
  verfyWithdraw,
  verifyDeposit,
} from "../controller/Admin.controller.js";

const adminRoute = Router();
adminRoute.get("/", (req, res) => {
  res.send("Hello from admin route");
});

adminRoute.get(
  "/getAllWithdrawHistory",
  authentication,
  IsAdmin,
  getAllWithdrawHistory
);
adminRoute.get(
  "/gellAllDepositHistory",
  authentication,
  IsAdmin,
  getAllDepositHistory
);
adminRoute.post("/verify-deposit", authentication, IsAdmin, verifyDeposit);
adminRoute.get(
  "/getAllPendingDeposits",
  authentication,
  IsAdmin,
  getAllPendingDeposits
);
adminRoute.get(
  "/getAllApprovedWithdraws",
  authentication,
  IsAdmin,
  getAllApprovedWithdraws
);
adminRoute.get(
  "/getAllApprovedDeposits",
  authentication,
  IsAdmin,
  getAllApprovedDeposits
);
adminRoute.get(
  "/getAllPendingWithdraws",
  authentication,
  IsAdmin,
  getAllPendingWithdraws
);
adminRoute.post("/verify-withdraw", authentication, IsAdmin, verfyWithdraw);

adminRoute.patch(
  "/update-deposit-status/:depositId",
  authentication,
  IsAdmin,
  updateDepositStatus
);

adminRoute.post("/reject-withdraw", authentication, IsAdmin, rejectWithdraw);

adminRoute.post("/reject-deposit", authentication, IsAdmin, rejectDeposit);

adminRoute.get(
  "/getDashboardStats",
  authentication,
  IsAdmin,
  getDashboardStats
);
adminRoute.get("/getAllUsers", authentication, IsAdmin, getAllUsers);
adminRoute.get("/searchUsers", authentication, IsAdmin, searchUsers);
adminRoute.get("/getUserDetails/:userId", authentication, IsAdmin, getUserDetails);

export default adminRoute;
