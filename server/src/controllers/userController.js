const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        bio: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true, wishlist: true, reviews: true } },
      },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, city, country, bio, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, address, city, country, bio, avatar },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        bio: true,
        role: true,
      },
    });

    res.json({ message: "Profile updated", user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/orders
const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
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
            },
          },
        },
      }),
      prisma.order.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/library  — purchased books
const getLibrary = async (req, res, next) => {
  try {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: req.user.id,
          status: { in: ["PAID", "DELIVERED", "PROCESSING", "SHIPPED"] },
        },
      },
      include: {
        book: {
          include: { genre: { select: { name: true, color: true } } },
        },
      },
      distinct: ["bookId"],
    });

    const books = orderItems.map((item) => item.book);
    res.json({ books });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        book: {
          include: { genre: { select: { name: true, color: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ wishlist: items.map((i) => i.book) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserOrders,
  getLibrary,
  getWishlist,
};
