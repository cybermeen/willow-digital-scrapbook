const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Shared: ensure upload directory exists ────────────────────────────────────

function makeStorage(prefix) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, uniqueName + ext);
    }
  });
}

// ── Image upload ──────────────────────────────────────────────────────────────

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const upload = multer({
  storage: makeStorage('photo'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Video upload ──────────────────────────────────────────────────────────────

const videoFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (MP4, MOV, WebM, AVI, MPEG) are allowed'), false);
  }
};

const videoUpload = multer({
  storage: makeStorage('video'),
  fileFilter: videoFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

// ── Audio upload ──────────────────────────────────────────────────────────────

const audioFilter = (req, file, cb) => {
  const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/x-m4a'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files (MP3, WAV, OGG, AAC, M4A) are allowed'), false);
  }
};

const audioUpload = multer({
  storage: makeStorage('audio'),
  fileFilter: audioFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = { upload, videoUpload, audioUpload };
