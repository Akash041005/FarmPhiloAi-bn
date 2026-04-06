const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../../uploads/crops');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const processImage = async (filePath) => {
  try {
    const processedPath = filePath.replace(path.extname(filePath), '_processed.jpg');

    await sharp(filePath)
      .resize(512, 512, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 60, progressive: true, mozjpeg: true })
      .toFile(processedPath);

    const processedBuffer = await sharp(processedPath)
      .toBuffer();

    fs.unlinkSync(filePath);
    fs.unlinkSync(processedPath);

    return processedBuffer;
  } catch (error) {
    console.error('Image Processing Error:', error);
    const originalBuffer = fs.readFileSync(filePath);
    return originalBuffer;
  }
};

const generateImageHash = async (filePath) => {
  try {
    const buffer = await sharp(filePath)
      .resize(256, 256, { fit: 'inside' })
      .grayscale()
      .raw()
      .toBuffer();

    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');
  } catch (error) {
    console.error('Hash generation error:', error);
    const buffer = fs.readFileSync(filePath);
    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');
  }
};

const createThumbnail = async (filePath) => {
  try {
    const thumbnailPath = filePath.replace(path.extname(filePath), '_thumb.jpg');
    
    await sharp(filePath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail Creation Error:', error);
    return filePath;
  }
};

module.exports = {
  upload,
  processImage,
  createThumbnail,
  generateImageHash
};