import { User } from "../model/User.model.js";

import optgenerator from "otp-generator";
import { Otp } from "../model/otp.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getRandomAvatar } from "../utils/avatarGenerator.js";
import { changePasswordTemplate } from "../templets/changePasswordTemplete.js";
import { sendMail } from "../utils/sendMail.js";
import { resetPasswordTemplate } from "../templets/resetPasswordTemplate.js";

dotenv.config();

// generate otp
export const generateOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("email is ", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Generate OTP
    const otp = optgenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    console.log("otp is ", otp);

    // Check if an OTP exists for the email
    const existingOtp = await Otp.findOne({ email: email });

    if (existingOtp) {
      // Update existing OTP
      existingOtp.otp = otp;
      await existingOtp.save(); // Save the updated OTP
      console.log("Updated OTP for existing user");
    } else {
      // Save new OTP to database
      await Otp.create({ email: email, otp: otp });
      console.log("Created new OTP for user");
    }

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      // otp, // Optionally return the generated OTP
    });
  } catch (error) {
    console.log("error while generating OTP", error); // Added error logging
    return res.status(500).json({
      success: false,
      message: "Something went wrong while generating OTP",
    });
  }
};

// export const Signup = async (req, res) => {
//   try {
//     console.log("req.body is ", req.body);
//     const { username, email, password, otp,role } = req.body;
//     console.log("username is ", username);
//     console.log("email is ", email);
//     console.log("password is ", password);
//     // console.log("otp is ", otp);

//     if (!username || !email || !password || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const IsUser = await User.findOne({ email: email });

//     if (IsUser) {
//       return res.json({
//         success: false,
//         message: "User already exists",
//       });
//     }

//     const dbotp = await Otp.findOne({ email: email });
//     console.log("dbotp is ", dbotp);

//     if (dbotp?.otp !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await User.create({
//       username: username,
//       email: email,
//       password: hashedPassword,
//       profilePic: `https://res.cloudinary.com/degag862k/image/upload/v1744893491/WhatsApp_Image_2025-04-17_at_09.07.23_19048e01_fk6hmm.jpg`,
//       Role:"USER"
//       // profilePic: `https://ui-avatars.com/api/?name=${username}+${username}&background=random&color=000`,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "User created successfully",
//       data: newUser,
//     });
//   } catch (error) {
//     console.log("error is ", error);
//     return res.status(500).json({
//       success: false,
//       message: "could not signup the user",
//     });
//   }
// };

// Generate random referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// export const Signup = async (req, res) => {
//   try {
//     console.log("req.body is ", req.body);
//     const { username, email, password, otp, role, referralCode, dateOfBirth } =
//       req.body;

//     if (!username || !email || !password || !otp || !dateOfBirth) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const existingUser = await User.findOne({ email: email });

//     if (existingUser) {
//       return res.json({
//         success: false,
//         message: "User already exists",
//       });
//     }

//     const dbotp = await Otp.findOne({ email: email });
//     if (dbotp?.otp !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Initialize wallet with ₹30 if referred
//     let walletAmount = 0;
//     let referredBy = null;

//     if (referralCode) {
//       const referrer = await User.findOne({ referralCode: referralCode });

//       if (!referrer) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid referral code",
//         });
//       }

//       // Reward both users
//       walletAmount = 50;
//       referredBy = referralCode;

//       referrer.balance = (referrer.balance || 0) + 300;
//       await referrer.save();
//     }

//     const profilePic = getRandomAvatar();
//     console.log("profilePic is ", profilePic);

//     const newUser = await User.create({
//       username,
//       email,
//       password: hashedPassword,
//       balance: walletAmount,
//       referredBy: referredBy,
//       referralCode: generateReferralCode(),
//       DateOfBirth: dateOfBirth,
//       profilePic:
//         profilePic ||
//         "https://res.cloudinary.com/degag862k/image/upload/v1744893491/WhatsApp_Image_2025-04-17_at_09.07.23_19048e01_fk6hmm.jpg",
//       Role: "USER",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "User created successfully",
//       data: newUser,
//     });
//   } catch (error) {
//     console.log("error is ", error);
//     return res.status(500).json({
//       success: false,
//       message: "Could not signup the user",
//     });
//   }
// };

export const Signup = async (req, res) => {
  try {
    console.log("req.body is ", req.body);
    const { username, email, password, otp, role, referralCode, dateOfBirth } =
      req.body;

    if (!username || !email || !password || !otp || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const dbotp = await Otp.findOne({ email });
    if (!dbotp || dbotp.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let walletAmount = 0;
    let referredBy = null;
    let bonusAmount = 0;

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }

      if (referrer.referralCode === referralCode) {
        bonusAmount = 50; // Bonus for the new user
        walletAmount = 50; // Wallet amount for the new user
      }

      referredBy = referralCode;

      // Reward referrer
      // referrer.balance = (referrer.balance || 0) + 300;
      // referrer.bonusAmount = (referrer.bonusAmount || 0) + 300;
      // console.log("referrer is ", referrer);
      // await referrer.save();
    }

    const profilePic = getRandomAvatar(); // Optional: fallback image logic

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      balance: walletAmount,
      bonusAmount: bonusAmount,
      bonusPlayedAmount: 0,
      referredBy: referredBy,
      referralCode: generateReferralCode(),
      DateOfBirth: dateOfBirth,
      profilePic:
        profilePic ||
        "https://res.cloudinary.com/degag862k/image/upload/v1744893491/WhatsApp_Image_2025-04-17_at_09.07.23_19048e01_fk6hmm.jpg",
      Role: "USER",
    });

    return res.status(200).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        balance: newUser.balance,
        bonusAmount: newUser.bonusAmount,
        bonusPlayedAmount: newUser.bonusPlayedAmount,
        referralCode: newUser.referralCode,
      },
    });
  } catch (error) {
    console.log("Signup error: ", error);
    return res.status(500).json({
      success: false,
      message: "Could not signup the user",
    });
  }
};
export const Login = async (req, res) => {
  console.log("req.body is ", req.body);
  try {
    const { email, password } = req.body;
    console.log("email is ", email);
    console.log("password is ", password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const isUserExist = await User.findOne({ email: email }, {}, { new: true });

    console.log("isuserExitst is ", isUserExist);
    if (!isUserExist) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      isUserExist.password || ""
    );
    if (!isPasswordMatch) {
      console.log("Password does not match");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const payload = {
      id: isUserExist._id,
      email: isUserExist.email,
      Role: isUserExist.Role,
    };

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not defined",
      });
    }

    // const token = jwt.sign(payload, JWT_SECRET, {
    //   expiresIn: "1d",
    // });

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "15d",
    });

    const JWT_SECRET_REFRESH = process.env.JWT_SECRET;
    if (!JWT_SECRET_REFRESH) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not defined",
      });
    }

    // // Generate refresh token (long-lived, e.g., 7 days)
    // const refreshToken = jwt.sign(payload, JWT_SECRET_REFRESH, {
    //   expiresIn: "7d",
    // });

    // // Set refresh token as a cookie
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: true, // Set to true for HTTPS, false for HTTP
    //   sameSite: "strict", // Adjust based on your requirements
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    // });

    const user = {
      ...isUserExist.toObject(),
      token: token,
    };
    user.password = "";

    console.log("user is ", user);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: user,
      token,
    });
  } catch (error) {
    console.log("could not login the user", error);
    return res.status(500).json({
      success: false,
      message: "could not login the user",
    });
  }
};

// export const sendOtp = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { email } = req.body;
//     console.log("email is ", email);

//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     // check if user user exists or not
//     const isUserExist = await User.findOne({ email: email });
//     if (!isUserExist) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     // Generate OTP
//     const otp = optgenerator.generate(6, {
//       digits: true,
//       lowerCaseAlphabets: false,
//       upperCaseAlphabets: false,
//       specialChars: false,
//     });

//     console.log("otp is ", otp);

//     // Check if an OTP exists for the email
//     const existingOtp = await Otp.findOne({ email: email });

//     if (existingOtp) {
//       // Update existing OTP
//       existingOtp.otp = otp;
//       await existingOtp.save(); // Save the updated OTP
//       console.log("Updated OTP for existing user");
//     } else {
//       // Save new OTP to database
//       await Otp.create({ email: email, otp: otp });
//       console.log("Created new OTP for user");
//     }

//     return res.status(200).json({
//       success: true,
//       message: "OTP generated successfully",
//       otp, // Optionally return the generated OTP
//     });
//   } catch (error) {
//     console.log("error while generating OTP", error); // Added error logging
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong while generating OTP",
//     });
//   }
// };

// export const ResetPassword = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   // fetch the email password otp from req.body
//   // validate it
//   // check if user user exists or not
//   // check if otp is correct or not
//   // update the password
//   // return success response

//   try {
//     // fetch the email password otp from req.body
//     const { email, password, otp } = req.body;
//     console.log("email is ", email);
//     console.log("password is ", password);
//     console.log("otp is ", otp);
//     // validate it
//     if (!email || !password || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }
//     // check if user user exists or not
//     const isUserExist = await User.findOne({ email: email });

//     if (!isUserExist) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     // check if otp is correct or not
//     const dbotp = await Otp.findOne({ email: email });
//     console.log("dbotp is ", dbotp);

//     if (!dbotp) {
//       return res.status(400).json({
//         success: false,
//         message: "otp timeout. please try again",
//       });
//     }
//     if (dbotp?.otp !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }

//     // update the password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     await User.updateOne({ email: email }, { password: hashedPassword });
//     // return success response
//     return res.status(200).json({
//       success: true,
//       message: "Password reset successfully",
//     });
//   } catch (error) {
//     console.log("could not reset the password", error);
//     return res.status(500).json({
//       success: false,
//       message: "could not reset the password",
//     });
//   }
// };

// export const changePassword = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { email, oldPassword, newPassword } = req.body;
//     console.log("email is ", email);
//     console.log("oldPassword is ", oldPassword);
//     console.log("newPassword is ", newPassword);
//     if (!email || !oldPassword || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }
//     const isUserExist = await User.findOne({ email: email }, {}, { new: true });

//     if (!isUserExist) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // check new password is not same as old password
//     if (bcrypt.compareSync(newPassword, isUserExist.password)) {
//       return res.status(400).json({
//         success: false,
//         message: "New password cannot be same as old password",
//       });
//     }

//     if (!(await bcrypt.compare(oldPassword, isUserExist.password))) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid old password",
//       });
//     } else {
//       const hashedPassword = await bcrypt.hash(newPassword, 10);
//       await User.updateOne({ email: email }, { password: hashedPassword });

//       return res.status(200).json({
//         success: true,
//         message: "Password changed successfully",
//       });
//     }
//   } catch (error) {
//     console.log("could not change the password", error);
//     return res.status(500).json({
//       success: false,
//       message: "could not change the password",
//     });
//   }
// };

export const changePassword = async (req, res) => {
  try {
    // fetch the data from req.body
    // get oldPassword newPassword confirme the password
    const { email, oldPassword, newPassword } = req.body;

    // validate
    if (!oldPassword || !newPassword) {
      return res.json({
        success: false,
        message: "all feild must be filled",
      });
    }

    // check if password is right or not :
    const user = await User.findOne({ email });
    console.log("user is ", user);

    //  campare the password saved in db to sent by user pass

    const compare = await bcrypt.compare(oldPassword, user.password);
    // console.log("bcrypt compare response is :", compare);
    if (!compare) {
      return res.json({
        success: false,
        message: "old password is incorrect please enter the right password",
      });
    }
    // update the password in db:
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
      { _id: user._id },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    console.log("udpated user is ", updatedUser);

    // send mail password in updated
    let htmlcontent = changePasswordTemplate(updatedUser.username);
    sendMail(updatedUser.email, "for password quries", htmlcontent);
    // return res
    return res.json({
      success: true,
      message: "password has been update",
    });
  } catch (error) {
    console.log("error in change password ", error);
    return res.json({
      success: false,
      message: "could not change the password",
      error,
    });
  }
};

export const ResetPassword = async (req, res) => {
  // fetch the email password otp from req.body
  // validate it
  // check if user user exists or not
  // check if otp is correct or not
  // update the password
  // return success response

  try {
    // fetch the email password otp from req.body
    const { email, password, otp } = req.body;
    console.log("email is ", email);
    console.log("password is ", password);
    console.log("otp is ", otp);
    // validate it
    if (!email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // check if user user exists or not
    const isUserExist = await User.findOne({ email: email });

    if (!isUserExist) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const dbotp = await Otp.findOne({ email: email });
    console.log("dbotp is ", dbotp);
    if (dbotp?.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    if (dbotp?.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // update the password
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ email: email }, { password: hashedPassword });

    let htmlcontent = resetPasswordTemplate(isUserExist.username);
    sendMail(isUserExist.email, "for password quries", htmlcontent);
    // return success response
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("could not reset the password", error);
    return res.status(500).json({
      success: false,
      message: "could not reset the password",
    });
  }
};
