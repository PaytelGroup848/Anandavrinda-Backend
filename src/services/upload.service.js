const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/ApiError');

const UPLOAD_BASE = path.join(__dirname, '../../uploads');

class UploadService {
  // ─── Save base64 image to disk & return FULL URL ─────────────────────────
  async saveBase64Image(base64String, folder = 'products') {
    try {
      if (!base64String || !base64String.startsWith('data:image')) {
        throw new ApiError(400, 'Invalid image format');
      }

      // Extract mime type and raw base64 data
      const matches = base64String.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new ApiError(400, 'Invalid image data');
      }

      // Handle extensions like "jpeg" → "jpg", "svg+xml" → "svg"
      let extension = matches[1].toLowerCase();
      if (extension === 'jpeg') extension = 'jpg';
      if (extension === 'svg+xml') extension = 'svg';

      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (buffer.length > maxSize) {
        throw new ApiError(400, 'Image size exceeds 5MB limit');
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
      const folderPath = path.join(UPLOAD_BASE, folder);

      // Ensure upload folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Write file to disk
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, buffer);

      // ✅ KEY FIX: Build the full accessible URL
      const backendUrl =
        process.env.BACKEND_URL ||
        `http://localhost:${process.env.PORT || 5000}`;

      const relativeUrl = `/uploads/${folder}/${filename}`;
      const fullUrl = `${backendUrl}${relativeUrl}`;

      return {
        url: fullUrl,          // ✅ Full URL: http://localhost:5000/uploads/categories/xyz.jpg
        relativeUrl,           // Relative path for internal use
        publicId: filename,
        filename,
        path: filePath,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('UploadService.saveBase64Image error:', error);
      throw new ApiError(500, 'Failed to save image');
    }
  }

  // ─── Delete image from disk ───────────────────────────────────────────────
  async deleteImage(publicId, folder = 'products') {
    try {
      if (!publicId) return false;

      // Support both filename only and full path
      const filename = path.basename(publicId);
      const filePath = path.join(UPLOAD_BASE, folder, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('UploadService.deleteImage error:', error);
      return false;
    }
  }

  // ─── Extract just the filename from a full URL or relative path ───────────
  extractFilename(urlOrPath) {
    if (!urlOrPath) return null;
    return path.basename(urlOrPath);
  }

  // ─── Check if a file exists ───────────────────────────────────────────────
  fileExists(publicId, folder = 'products') {
    if (!publicId) return false;
    const filename = path.basename(publicId);
    const filePath = path.join(UPLOAD_BASE, folder, filename);
    return fs.existsSync(filePath);
  }
}

module.exports = new UploadService();