import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const directory = process.env.UPLOAD_DIR || 'uploads';
    fs.mkdirSync(directory, { recursive: true });
    cb(null, directory);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const verificationStorage = multer.diskStorage({
  destination(req, file, cb) {
    const directory = process.env.VERIFICATION_UPLOAD_DIR || 'verification-uploads';
    fs.mkdirSync(directory, { recursive: true });
    cb(null, directory);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image uploads are allowed'));
}

function mediaFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true);
  cb(new Error('Only image and video uploads are allowed'));
}

function documentFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') return cb(null, true);
  cb(new Error('Verification documents must be an image or PDF'));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const mediaUpload = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const verificationUpload = multer({
  storage: verificationStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 3 },
});
