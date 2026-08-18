import fs from 'node:fs';
import path from 'node:path';
import { fileTypeFromFile } from 'file-type';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const ensureDirectory = (destination) => {
  fs.mkdirSync(destination, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'misc';
    const destination = path.join(process.cwd(), env.UPLOAD_DIR, folder);
    ensureDirectory(destination);
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
    return cb(new ApiError(400, 'Only JPG, PNG, and WebP image uploads are supported.'));
  }

  return cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const useUploadFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};

export const getPublicFilePath = (file, folder) => `/uploads/${folder}/${file.filename}`;

export const removeManagedUpload = async (publicPath, folder) => {
  const prefix = `/uploads/${folder}/`;
  if (typeof publicPath !== 'string' || !publicPath.startsWith(prefix)) return false;

  const filename = publicPath.slice(prefix.length);
  if (!filename || filename !== path.basename(filename)) return false;

  const folderRoot = path.resolve(process.cwd(), env.UPLOAD_DIR, folder);
  const target = path.resolve(folderRoot, filename);
  if (path.dirname(target) !== folderRoot) return false;

  try {
    await fs.promises.rm(target, { force: true });
    return true;
  } catch (error) {
    console.error('Could not remove managed upload.', error);
    return false;
  }
};

const removeFile = async (file) => {
  if (file?.path) {
    await fs.promises.rm(file.path, { force: true });
  }
};

export const removeUploadedFiles = async (req) => {
  const files = [
    ...(req.file ? [req.file] : []),
    ...(Array.isArray(req.files) ? req.files : []),
  ];
  await Promise.all(files.map(removeFile));
};

export const validateUploadedFiles = asyncHandler(async (req, res, next) => {
  const files = [
    ...(req.file ? [req.file] : []),
    ...(Array.isArray(req.files) ? req.files : []),
  ];

  for (const file of files) {
    const detectedType = await fileTypeFromFile(file.path);

    if (!detectedType || !allowedMimeTypes.has(detectedType.mime)) {
      await removeUploadedFiles(req);
      throw new ApiError(400, 'Uploaded file content is not a supported image type.');
    }
  }

  next();
});
