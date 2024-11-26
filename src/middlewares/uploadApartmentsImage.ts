import multer from "multer";
import path from "path";
import fs from "fs";

// Update this path to the absolute path where you want to store the images
const uploadDirectory = path.join("D:", "Current Projects", "BuildupInvestment", "backend", "uploads", "apartments");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Ensure the directory exists or create it if it doesn't
      if (!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory, { recursive: true });
      }
      cb(null, uploadDirectory);  // Use the updated uploadDirectory path
    } catch (err) {
      console.error('Error creating upload directory:', err);
      cb(err, uploadDirectory);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename for the uploaded image
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `apartment-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."),
      false
    );
  }
};

export const apartmentImageUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  }
}).single('image');  // For single image upload

// Helper function to remove uploaded file
export const removeUploadedFile = (filePath: string) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);  // Delete the file
      console.log('File removed successfully:', filePath);
    }
  } catch (error) {
    console.error('Error removing uploaded file:', error);
  }
};
