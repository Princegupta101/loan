"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSalarySlip = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
const isCloudinaryConfigured = cloudName &&
    apiKey &&
    apiSecret &&
    !cloudName.startsWith('your_') &&
    !apiKey.startsWith('your_') &&
    !apiSecret.startsWith('your_');
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: cloudName.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim()
    });
    console.log('Cloudinary active.');
}
else {
    console.log('Cloudinary inactive. Fallback to local storage.');
}
const uploadSalarySlip = async (filePath, filename) => {
    if (!isCloudinaryConfigured) {
        return `/uploads/${filename}`;
    }
    try {
        const fileExtension = filename.split('.').pop()?.toLowerCase();
        const resourceType = fileExtension === 'pdf' ? 'raw' : 'image';
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            folder: 'lms_salary_slips',
            resource_type: resourceType,
            access_mode: 'public'
        });
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        return result.secure_url;
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        return `/uploads/${filename}`;
    }
};
exports.uploadSalarySlip = uploadSalarySlip;
