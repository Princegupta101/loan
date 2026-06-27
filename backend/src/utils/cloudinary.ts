import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

const isCloudinaryConfigured = 
  cloudName && 
  apiKey && 
  apiSecret && 
  !cloudName.startsWith('your_') && 
  !apiKey.startsWith('your_') && 
  !apiSecret.startsWith('your_');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName.trim(),
    api_key: apiKey.trim(),
    api_secret: apiSecret.trim()
  });
  console.log('Cloudinary active.');
} else {
  console.log('Cloudinary inactive. Fallback to local storage.');
}

export const uploadSalarySlip = async (filePath: string, filename: string): Promise<string> => {
  if (!isCloudinaryConfigured) {
    return `/uploads/${filename}`;
  }

  try {
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    const resourceType = fileExtension === 'pdf' ? 'raw' : 'image';

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'lms_salary_slips',
      resource_type: resourceType,
      access_mode: 'public'
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return `/uploads/${filename}`;
  }
};
