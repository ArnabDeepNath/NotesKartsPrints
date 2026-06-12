const getStripe = () => require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const { sendOrderConfirmation } = require("../utils/emailService");
const { getSiteSettings } = require("../utils/siteSettings");
const { mergeOrderNotes } = require("../utils/orderNotes");

// POST /api/orders  — create a pending order from cart
const createOrder = async (req, res, next) => {
  try {
    const { items, printJobs, shippingAddress, paymentMethod } = req.body;
    // items: [{ bookId, quantity }]
    // printJobs: [ "uuid-1", "uuid-2" ]

    const hasItems = items && items.length > 0;
    const hasPrintJobs = printJobs && printJobs.length > 0;

    if (!hasItems && !hasPrintJobs) {
      throw new AppError("Order must have at least one item or print job", 400);
    }

    const settings = await getSiteSettings();
    const requestedPaymentMethod = String(
      paymentMethod || "ONLINE",
    ).toUpperCase();

    if (!["ONLINE", "COD", "RAZORPAY"].includes(requestedPaymentMethod)) {
      throw new AppError("Unsupported payment method", 400);
    }

    if (requestedPaymentMethod === "COD" && !settings.pricing.codEnabled) {
      throw new AppError("Cash on delivery is currently unavailable", 400);
    }

    const bookIds = items?.map((i) => i.bookId) || [];
    let books = [];
    try {
      books = await prisma.book.findMany({
        where: { id: { in: bookIds }, isActive: true },
        include: { variations: true },
      });
    } catch (err) {
      if (err.code === "P2022" || err.code === "P2021") {
        console.warn(
          "[createOrder] Schema missing, falling back to safe select...",
        );
        let hasVariations = false;
        try {
          const res =
            await prisma.$queryRaw`SHOW TABLES LIKE 'book_variations'`;
          if (res && res.length > 0) hasVariations = true;
        } catch {
          hasVariations = false;
        }

        const safeSelect = {
          id: true,
          title: true,
          stock: true,
          price: true,
          coverImage: true,
        };

        if (hasVariations) {
          safeSelect.variations = true;
        }

        books = await prisma.book.findMany({
          where: { id: { in: bookIds }, isActive: true },
          select: safeSelect,
        });
      } else {
        throw err;
      }
    }

    if (books.length !== bookIds.length) {
      throw new AppError("One or more books not found", 404);
    }

    // Validate stock and pricing
    for (const item of items || []) {
      const book = books.find((b) => b.id === item.bookId);
      let variant = null;
      if (item.variationId) {
        variant = book.variations.find((v) => v.id === item.variationId);
        if (!variant)
          throw new AppError(`Variation not found for "${book.title}"`, 404);
      }

      const availableStock = variant ? variant.stock : book.stock;
      if (availableStock < item.quantity) {
        throw new AppError(`Insufficient stock for "${book.title}"`, 400);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = (items || []).map((item) => {
      const book = books.find((b) => b.id === item.bookId);
      let variant = null;
      if (item.variationId) {
        variant = book.variations.find((v) => v.id === item.variationId);
      }

      const itemPrice = variant ? Number(variant.price) : Number(book.price);
      const lineTotal = itemPrice * item.quantity;
      subtotal += lineTotal;
      return {
        bookId: item.bookId,
        variationId: item.variationId || null,
        quantity: item.quantity,
        price: itemPrice,
      };
    });

    // Process Print Jobs
    let printJobRecords = [];
    if (hasPrintJobs) {
      printJobRecords = await prisma.printJob.findMany({
        where: { id: { in: printJobs }, userId: req.user.id },
      });
      if (printJobRecords.length !== printJobs.length) {
        throw new AppError(
          "One or more print jobs not found or unauthorized",
          404,
        );
      }
      console.log(
        `[createOrder] Processing ${printJobRecords.length} print jobs:`,
      );
      printJobRecords.forEach((pj) => {
        console.log(
          `  - ${pj.fileName} (${pj.pages}p, ${pj.copies}x) | URL: ${pj.fileUrl}`,
        );
      });
    }

    for (const pj of printJobRecords) {
      subtotal += Number(pj.price);
    }

    const shippingCharge =
      subtotal >= Number(settings.pricing.freeShippingThreshold || 0)
        ? 0
        : Number(settings.pricing.shippingCost || 0);
    const taxRate = Number(settings.pricing.taxRate || 0) / 100;
    const tax = +(subtotal * taxRate).toFixed(2);
    const total = +(subtotal + tax + shippingCharge).toFixed(2);
    
    // Check if order total exceeds online payment threshold for partial payment
    let finalPaymentMethod = requestedPaymentMethod;
    let onlineAmount = null;
    let codAmount = null;
    
    const threshold = Number(settings.pricing.onlinePaymentThreshold || 0);
    const percent = Number(settings.pricing.onlinePaymentPercent || 0);
    
    if (requestedPaymentMethod === "ONLINE" && threshold > 0 && total > threshold) {
      // Calculate amounts for split payment
      onlineAmount = +(total * (percent / 100)).toFixed(2);
      codAmount = +(total - onlineAmount).toFixed(2);
      finalPaymentMethod = "PARTIAL_ONLINE";
    }

    const normalizedPaymentMethod =
      requestedPaymentMethod === "RAZORPAY" ? "ONLINE" : requestedPaymentMethod;
    
    const notes = mergeOrderNotes(null, {
      pricing: {
        shippingCharge,
        taxRate: Number(settings.pricing.taxRate || 0),
        freeShippingThreshold: Number(
          settings.pricing.freeShippingThreshold || 0,
        ),
      },
      logistics: {
        provider: settings.logistics.provider,
        shiprocketEnabled: settings.logistics.shiprocketEnabled,
      },
    });

    let order;
    try {
      order = await prisma.order.create({
        data: {
          userId: req.user.id,
          subtotal,
          tax,
          total,
          onlineAmount,
          codAmount,
          paymentMethod:
            normalizedPaymentMethod === "COD" ? "cod" : "pending-online",
          notes,
          shippingName: shippingAddress?.name,
          shippingEmail: shippingAddress?.email || req.user.email,
          shippingPhone: shippingAddress?.phone || req.user.phone || null,
          shippingAddress: shippingAddress?.address,
          shippingCity: shippingAddress?.city,
          shippingCountry: shippingAddress?.country,
          shippingZip: shippingAddress?.zip,
          items: items?.length > 0 ? { create: orderItems } : undefined,
          printJobs:
            printJobs?.length > 0
              ? { connect: printJobs.map((id) => ({ id })) }
              : undefined,
        },
        include: {
          items: {
            include: { book: { select: { title: true, coverImage: true } } },
          },
          printJobs: true,
        },
      });
    } catch (createErr) {
      if (createErr.code === "P2022" || createErr.code === "P2021") {
        console.warn(
          "[createOrder] Schema missing inside order create, falling back...",
        );
        const safeOrderItems = orderItems.map(
          ({ variationId, ...rest }) => rest,
        );
        let hasPrintJobsTable = false;
        try {
          const pRes = await prisma.$queryRaw`SHOW TABLES LIKE 'print_jobs'`;
          if (pRes && pRes.length > 0) hasPrintJobsTable = true;
        } catch {
          hasPrintJobsTable = false;
        }

        const safeOrderSelect = {
          id: true,
          userId: true,
          status: true,
          subtotal: true,
          discount: true,
          tax: true,
          total: true,
          currency: true,
          paymentMethod: true,
          paymentId: true,
          notes: true,
          shippingName: true,
          shippingEmail: true,
          shippingPhone: true,
          shippingAddress: true,
          shippingCity: true,
          shippingCountry: true,
          shippingZip: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              orderId: true,
              bookId: true,
              quantity: true,
              price: true,
              book: { select: { title: true, coverImage: true } },
            },
          },
        };

        if (hasPrintJobsTable) {
          safeOrderSelect.printJobs = true;
        }

        order = await prisma.order.create({
          data: {
            userId: req.user.id,
            subtotal,
            tax,
            total,
            onlineAmount,
            codAmount,
            paymentMethod:
              normalizedPaymentMethod === "COD" ? "cod" : "pending-online",
            notes,
            shippingName: shippingAddress?.name,
            shippingEmail: shippingAddress?.email || req.user.email,
            shippingPhone: shippingAddress?.phone || req.user.phone || null,
            shippingAddress: shippingAddress?.address,
            shippingCity: shippingAddress?.city,
            shippingCountry: shippingAddress?.country,
            shippingZip: shippingAddress?.zip,
            items: items?.length > 0 ? { create: safeOrderItems } : undefined,
            ...(hasPrintJobsTable && printJobs?.length > 0
              ? { printJobs: { connect: printJobs.map((id) => ({ id })) } }
              : {}),
          },
          select: safeOrderSelect,
        });
      } else {
        throw createErr;
      }
    }

    // Attempt to send email but don't fail order if it fails
    try {
      await sendOrderConfirmation(
        shippingAddress?.email || req.user.email,
        order,
        order.printJobs,
      );
    } catch (emailErr) {
      console.error("Failed to send order confirmation email:", emailErr);
    }

    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    let order;
    try {
      order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  coverImage: true,
                  author: true,
                },
              },
              variation: true,
            },
          },
          printJobs: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });
    } catch (err) {
      if (err.code === "P2022" || err.code === "P2021") {
        let hasPrintJobsTable = false;
        try {
          const pRes = await prisma.$queryRaw`SHOW TABLES LIKE 'print_jobs'`;
          if (pRes && pRes.length > 0) hasPrintJobsTable = true;
        } catch {
          hasPrintJobsTable = false;
        }

        const safeGetSelect = {
          id: true,
          userId: true,
          status: true,
          subtotal: true,
          discount: true,
          tax: true,
          total: true,
          currency: true,
          paymentMethod: true,
          paymentId: true,
          shippingName: true,
          shippingEmail: true,
          shippingPhone: true,
          shippingAddress: true,
          shippingCity: true,
          shippingCountry: true,
          shippingZip: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              orderId: true,
              bookId: true,
              quantity: true,
              price: true,
              book: {
                select: {
                  id: true,
                  title: true,
                  coverImage: true,
                  author: true,
                },
              },
            },
          },
          user: { select: { id: true, name: true, email: true } },
        };

        if (hasPrintJobsTable) {
          safeGetSelect.printJobs = true;
        }

        order = await prisma.order.findUnique({
          where: { id: req.params.id },
          select: safeGetSelect,
        });
      } else throw err;
    }

    if (!order) throw new AppError("Order not found", 404);
    if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
      throw new AppError("Access denied", 403);
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getOrder };
