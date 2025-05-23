import { Router } from "express";
import { authentication } from "../middleware/authantication.js";
import {
  DipositMoney,
  getUserBalance,
  getUserBankDetails,
  getUserBetHistoryByGameType,
  getUserBetHistoryHeadTail,
  getUserBonus,
  getUserDeposits,
  getUserWithdrawHistory,
  SaveUserBankDetails,
  withdrawMoney,
} from "../controller/User.controller.js";
import { assignReferralCodes } from "../controller/assignReffralCode.js";

const userRoute = Router();

userRoute.post("/deposit-money", authentication, DipositMoney);
userRoute.get("/get-user-deposits/:userId", authentication, getUserDeposits);
userRoute.get(
  "/get-user-balance",
  authentication,
  authentication,
  getUserBalance
);
userRoute.get(
  "/get-user-withdraw-history/:userId",
  authentication,
  getUserWithdrawHistory
);
userRoute.post("/save-user-Bank-Details", authentication, SaveUserBankDetails);
userRoute.post("/create-withdraw-request", authentication, withdrawMoney);
userRoute.get(
  "/getUserBankDetails/:userId",
  authentication,
  getUserBankDetails
);
userRoute.get("/get-user-bonus/:userId", authentication, getUserBonus);

userRoute.get("/assign-referrals", assignReferralCodes);

userRoute.get("/get-head-tail-gameHistory",authentication, getUserBetHistoryHeadTail);


// routes/betHistory.routes.js
userRoute.get(
  '/get-bet-history/:gameType',
  authentication,
  getUserBetHistoryByGameType
);
export default userRoute;
