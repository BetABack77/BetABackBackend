import { User } from "../model/User.model.js";

// Function to generate a random 6-character alphanumeric referral code
const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const assignReferralCodes = async (req, res) => {
  try {
    const usersWithoutReferral = await User.find({
      referralCode: { $exists: false },
    });

    let updatedCount = 0;

    for (const user of usersWithoutReferral) {
      let newCode;
      let exists = true;

      // Generate a unique referral code
      while (exists) {
        newCode = generateReferralCode();
        const existing = await User.findOne({ referralCode: newCode });
        exists = !!existing;
      }

      user.referralCode = newCode;
      await user.save();
      updatedCount++;
    }

    res.status(200).json({
      message: `Referral codes assigned to ${updatedCount} users.`,
    });
  } catch (error) {
    console.error("Error assigning referral codes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
