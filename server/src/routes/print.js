const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadDocument, calculatePrice, createPrintJob } = require("../controllers/printController");
const { authenticate } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../uploads/prints");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDFs are allowed for printing.'));
  }
});

router.post("/upload", authenticate, upload.single("document"), uploadDocument);
router.post("/calculate-price", calculatePrice);
router.post("/job", authenticate, createPrintJob);

module.exports = router;
