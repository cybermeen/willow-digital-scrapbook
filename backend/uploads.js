const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Where to save files and what to name them
const storage = multer.diskStorage({

  // destination: which folder to save uploaded files in
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    // Create the directory if it doesn't exist yet
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // cb stands for 'callback' — call it with (error, path)
    cb(null, uploadDir);
  },

  // filename: generate a unique name so files don't overwrite each other
  filename: (req, file, cb) => {
    // Example result: photo-1704067200000-823941234.jpg
    const uniqueName = `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueName + ext);
  }
});

// fileFilter: reject files that aren't images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);   // Accept the file
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// Create the multer instance with our configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10 MB maximum per file
  }
});

module.exports = upload;
