const fs = require("fs");
const pdfParseModule = require("pdf-parse");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const { getSiteSettings } = require("../utils/siteSettings");

const legacyPdfParse =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : typeof pdfParseModule.default === "function"
      ? pdfParseModule.default
      : null;

const PdfParser =
  typeof pdfParseModule.PDFParse === "function"
    ? pdfParseModule.PDFParse
    : null;

const getPdfPageCount = async (dataBuffer) => {
  if (legacyPdfParse) {
    const data = await legacyPdfParse(dataBuffer);
    return data.numpages || data.numPages || 1;
  }

  if (PdfParser) {
    const parser = new PdfParser({ data: dataBuffer });

    try {
      const info = await parser.getInfo();
      return info.total || 1;
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy().catch(() => undefined);
      }
    }
  }

  throw new TypeError("Unsupported pdf-parse export shape");
};

const calculateJobPrice = async (
  pages,
  copies,
  colorMode,
  binding,
  printType,
  paperType,
) => {
  const settings = await getSiteSettings();
  const pricing = settings.printing;
  const pType = printType || "LAZER";
  const pPaper = paperType || "70_GSM";

  const basePagePrice =
    colorMode === "COLOR"
      ? pType === "INKTANK"
        ? pricing.colorInktankPrice
        : pricing.colorLazerPrice
      : pType === "INKTANK"
        ? pricing.bwInktankPrice
        : pricing.bwLazerPrice;

  const paperPrice = pricing.paperPrices[pPaper] || 0;

  const totalPagePrice = (basePagePrice + paperPrice) * pages;
  const bindingPrice = pricing.bindingPrices[binding] || 0;

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
      pages = await getPdfPageCount(dataBuffer);
    } catch (e) {
      console.error("PDF Parse error", e);
      throw new AppError(
        "Failed to parse PDF document. Ensure it is a valid PDF.",
        400,
      );
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
    const { pages, copies, colorMode, binding, printType, paperType } =
      req.body;
    const price = await calculateJobPrice(
      Number(pages) || 1,
      Number(copies) || 1,
      colorMode || "BW",
      binding || "NONE",
      printType || "LAZER",
      paperType || "70_GSM",
    );
    res.json({ price });
  } catch (err) {
    next(err);
  }
};

const createPrintJob = async (req, res, next) => {
  try {
    const {
      fileUrl,
      fileName,
      pages,
      copies,
      colorMode,
      binding,
      paperSize,
      printType,
      paperType,
    } = req.body;

    if (!fileUrl || !fileName) {
      throw new AppError("Upload a document before adding it to cart", 400);
    }

    const price = await calculateJobPrice(
      pages,
      copies,
      colorMode,
      binding,
      printType,
      paperType,
    );

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
        printType: printType || "LAZER",
        paperType: paperType || "70_GSM",
        price,
        status: "PENDING",
      },
    });

    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadDocument,
  calculatePrice,
  createPrintJob,
};
