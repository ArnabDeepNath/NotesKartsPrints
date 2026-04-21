const fs = require("fs");
const pdfParse = require("pdf-parse");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

const PRICING = {
  BW: {
    LAZER: 2.0,
    INKTANK: 1.0
  },
  COLOR: {
    LAZER: 10.0,
    INKTANK: 5.0
  },
  PAPER: {
    "70_GSM": 0,
    "75_GSM": 0.5,
    "80_GSM": 1.0,
    "100_GSM": 2.0,
    "120_GSM": 3.0
  },
  BINDING: {
    NONE: 0,
    SPIRAL: 50,
    SOFTBOUND: 100,
    HARDBOUND: 150
  }
};

const calculateJobPrice = (pages, copies, colorMode, binding, printType, paperType) => {
  const pType = printType || 'LAZER';
  const pPaper = paperType || '70_GSM';
  
  const basePagePrice = colorMode === 'COLOR' 
    ? (PRICING.COLOR[pType] || PRICING.COLOR.LAZER) 
    : (PRICING.BW[pType] || PRICING.BW.LAZER);
    
  const paperPrice = PRICING.PAPER[pPaper] || 0;
  
  const totalPagePrice = (basePagePrice + paperPrice) * pages;
  const bindingPrice = PRICING.BINDING[binding] || 0;
  
  return (totalPagePrice + bindingPrice) * copies;
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
    const { pages, copies, colorMode, binding, printType, paperType } = req.body;
    const price = calculateJobPrice(
      Number(pages) || 1, 
      Number(copies) || 1, 
      colorMode || 'BW', 
      binding || 'NONE',
      printType || 'LAZER',
      paperType || '70_GSM'
    );
    res.json({ price });
  } catch (err) {
    next(err);
  }
};

const createPrintJob = async (req, res, next) => {
  try {
    const { fileUrl, fileName, pages, copies, colorMode, binding, paperSize, printType, paperType } = req.body;
    
    const price = calculateJobPrice(pages, copies, colorMode, binding, printType, paperType);

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
        printType: printType || 'LAZER',
        paperType: paperType || '70_GSM',
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
