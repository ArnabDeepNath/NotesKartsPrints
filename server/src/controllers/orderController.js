const getStripe = () => require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// POST /api/orders  — create a pending order from cart
const createOrder = async (req, res, next) => {
  try {
    const { items, printJobs, shippingAddress } = req.body;
    // items: [{ bookId, quantity }]
    // printJobs: [ "uuid-1", "uuid-2" ]

    const hasItems = items && items.length > 0;
    const hasPrintJobs = printJobs && printJobs.length > 0;

    if (!hasItems && !hasPrintJobs) {
      throw new AppError("Order must have at least one item or print job", 400);
    }

    const bookIds = items?.map((i) => i.bookId) || [];
    let books = [];
    try {
      books = await prisma.book.findMany({
        where: { id: { in: bookIds }, isActive: true },
        include: { variations: true }
      });
    } catch (err) {
      if (err.code === "P2022" || err.code === "P2021") {
        console.warn("[createOrder] Schema missing, falling back to safe select...");
        let hasVariations = false;
        try {
          const res = await prisma.$queryRaw`SHOW TABLES LIKE 'book_variations'`;
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
    for (const item of (items || [])) {
      const book = books.find((b) => b.id === item.bookId);
      let variant = null;
      if (item.variationId) {
         variant = book.variations.find(v => v.id === item.variationId);
         if (!variant) throw new AppError(`Variation not found for "${book.title}"`, 404);
      }

      const availableStock = variant ? variant.stock : book.stock;
      if (availableStock < item.quantity) {
        throw new AppError(`Insufficient stock for "${book.title}"`, 400);
      }
    }

    // Process Print Jobs
    let printJobRecords = [];
    if (hasPrintJobs) {
      printJobRecords = await prisma.printJob.findMany({
        where: { id: { in: printJobs }, userId: req.user.id }
      });
      if (printJobRecords.length !== printJobs.length) {
        throw new AppError("One or more print jobs not found or unauthorized", 404);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = (items || []).map((item) => {
      const book = books.find((b) => b.id === item.bookId);
      let variant = null;
      if (item.variationId) {
        variant = book.variations.find(v => v.id === item.variationId);
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

    for (const pj of printJobRecords) {
      subtotal += Number(pj.price);
    }

    const tax = +(subtotal * 0.18).toFixed(2); // 18% GST
    const total = +(subtotal + tax).toFixed(2);

    let order;
    try {
      order = await prisma.order.create({
        data: {
          userId: req.user.id,
          subtotal,
          tax,
          total,
          shippingName: shippingAddress?.name,
          shippingEmail: shippingAddress?.email || req.user.email,
          shippingPhone: shippingAddress?.phone,
          shippingAddress: shippingAddress?.address,
          shippingCity: shippingAddress?.city,
          shippingCountry: shippingAddress?.country,
          shippingZip: shippingAddress?.zip,
          items: items?.length > 0 ? { create: orderItems } : undefined,
          printJobs: printJobs?.length > 0 ? { connect: printJobs.map(id => ({ id })) } : undefined,
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
        console.warn("[createOrder] Schema missing inside order create, falling back...");
        const safeOrderItems = orderItems.map(({ variationId, ...rest }) => rest);
        order = await prisma.order.create({
          data: {
            userId: req.user.id,
            subtotal,
            tax,
            total,
            shippingName: shippingAddress?.name,
            shippingEmail: shippingAddress?.email || req.user.email,
            shippingPhone: shippingAddress?.phone,
            shippingAddress: shippingAddress?.address,
            shippingCity: shippingAddress?.city,
            shippingCountry: shippingAddress?.country,
            shippingZip: shippingAddress?.zip,
            items: items?.length > 0 ? { create: safeOrderItems } : undefined,
            printJobs: printJobs?.length > 0 ? { connect: printJobs.map(id => ({ id })) } : undefined,
          },
          include: {
            items: {
              include: { book: { select: { title: true, coverImage: true } } },
            },
            printJobs: true,
          },
        });
      } else {
        throw createErr;
      }
    }

    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            book: {
              select: { id: true, title: true, coverImage: true, author: true },
            },
            variation: true,
          },
        },
        printJobs: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

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
