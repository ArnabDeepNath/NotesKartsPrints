const path = require("path");
const fs = require("fs");
const os = require("os");

/**
 * Returns the persistent uploads directory.
 *
 * Priority:
 *  1. UPLOADS_DIR environment variable (absolute path preferred)
 *  2. ~/.basak-uploads (user home fallback — survives redeploys on Hostinger)
 *  3. ../../uploads relative to this file (current dev default)
 *
 * The function also ensures the directory exists.
 */
function getUploadsDir() {
  const envDir = process.env.UPLOADS_DIR;

  let baseDir;
  if (envDir) {
    baseDir = path.resolve(envDir);
  } else if (process.env.NODE_ENV === "production") {
    // On shared hosts like Hostinger the project folder may be wiped/redeployed.
    // Use a directory outside the project so files survive.
    baseDir = path.join(os.homedir(), ".basak-uploads");
  } else {
    baseDir = path.join(__dirname, "../../uploads");
  }

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  return baseDir;
}

/**
 * Ensures a subdirectory of the uploads folder exists and returns its path.
 */
function ensureUploadSubdir(subdir) {
  const uploadsDir = getUploadsDir();
  const dir = path.join(uploadsDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

module.exports = { getUploadsDir, ensureUploadSubdir };
