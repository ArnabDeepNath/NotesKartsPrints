const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  uploadDocument,
  calculatePrice,
  createPrintJob,
} = require("../controllers/printController");
const { authenticate } = require("../middleware/auth");

// Configure storage for PDF uploads. The destination directory must match the
// static files middleware defined in server/src/app.js, which serves files from
// "../uploads" relative to that file (i.e., the "server/uploads" folder). The
// previous implementation used "../../../uploads/prints", which resolved to a
// top‑level "uploads" directory outside of the "server" folder, causing the
// uploaded PDFs to be stored in the wrong location and resulting in 404 errors
// when attempting to download them. The corrected path goes up two levels from
// this file ("server/src/routes") to the "server" directory, then into
// "uploads/prints".
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // __dirname points to ".../server/src/routes"
    const uploadDir = path.join(__dirname, "../../uploads/prints");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDFs are allowed for printing."));
  },
});

router.post("/upload", authenticate, upload.single("document"), uploadDocument);
router.post("/calculate-price", calculatePrice);
router.post("/job", authenticate, createPrintJob);

module.exports = router;
