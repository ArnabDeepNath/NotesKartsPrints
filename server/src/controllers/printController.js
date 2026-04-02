const fs = require("fs");
const pdfParse = require("pdf-parse");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// Pricing Logic
const PRICING = {
  BW: 1.0,
  COLOR: 5.0,
  BINDING: {
    NONE: 0,
    SPIRAL: 50,
    SOFTBOUND: 100,
    HARDBOUND: 150
  }
};

const calculateJobPrice = (pages, copies, colorMode, binding) => {
  const pagePrice = (colorMode === 'COLOR' ? PRICING.COLOR : PRICING.BW) * pages;
  const bindingPrice = PRICING.BINDING[binding] || 0;
  return (pagePrice + bindingPrice) * copies;
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError("No file uploaded", 400);

    const filePath = req.file.path;
    const fileUrl = `/uploads/prints/${req.file.filename}`;
    
    // Parse PDF for pages
    const dataBuffer = fs.readFileSync(filePath);
    let pages = 1;
    try {
      const data = await pdfParse(dataBuffer);
      pages = data.numpages || 1;
    } catch (e) {
      console.error("PDF Parse error", e);
      throw new AppError("Failed to parse PDF document. Ensure it is a valid PDF.", 400);
    }

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      pages,
    });
  } catch (err) {
    next(err);
  }
};

const calculatePrice = async (req, res, next) => {
  try {
    const { pages, copies, colorMode, binding } = req.body;
    const price = calculateJobPrice(
      Number(pages) || 1, 
      Number(copies) || 1, 
      colorMode || 'BW', 
      binding || 'NONE'
    );
    res.json({ price });
  } catch (err) {
    next(err);
  }
};

const createPrintJob = async (req, res, next) => {
  try {
    const { fileUrl, fileName, pages, copies, colorMode, binding, paperSize } = req.body;
    
    const price = calculateJobPrice(pages, copies, colorMode, binding);

    const job = await prisma.printJob.create({
      data: {
        userId: req.user.id,
        fileUrl,
        fileName,
        pages: Number(pages),
        copies: Number(copies),
        colorMode,
        binding,
        paperSize,
        price,
        status: "PENDING"
      }
    });

    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadDocument,
  calculatePrice,
  createPrintJob
};
