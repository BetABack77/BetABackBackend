import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
export const connectDb = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined in the environment variables");
  }

  try {  
    const conn = await mongoose.connect(dbUrl);
    console.log("MongoDB Connected successfull");
  } catch (error) {
   console.log("could not coonet to db");
    console.log(error);
    process.exit(1);
  }
    
};
