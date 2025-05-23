// cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Ensure that you have your environment variables set correctly
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Please set your Cloudinary credentials in the environment variables');
}

// Configuration
cloudinary.config({    
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
