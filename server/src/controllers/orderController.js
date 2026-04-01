const getStripe = () => require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// POST /api/orders  — create a pending order from cart
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress } = req.body;
    // items: [{ bookId, quantity }]

    if (!items || items.length === 0) {
      throw new AppError("Order must have at least one item", 400);
    }

    // Fetch all books
    const bookIds = items.map((i) => i.bookId);
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds }, isActive: true },
    });

    if (books.length !== bookIds.length) {
      throw new AppError("One or more books not found", 404);
    }

    // Validate stock
    for (const item of items) {
      const book = books.find((b) => b.id === item.bookId);
      if (book.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${book.title}"`, 400);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const book = books.find((b) => b.id === item.bookId);
      const lineTotal = Number(book.price) * item.quantity;
      subtotal += lineTotal;
      return {
        bookId: item.bookId,
        quantity: item.quantity,
        price: Number(book.price),
      };
    });

    const tax = +(subtotal * 0.18).toFixed(2); // 18% GST
    const total = +(subtotal + tax).toFixed(2);

    const order = await prisma.order.create({
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
        items: { create: orderItems },
      },
      include: {
        items: {
          include: { book: { select: { title: true, coverImage: true } } },
        },
      },
    });

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
          },
        },
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
