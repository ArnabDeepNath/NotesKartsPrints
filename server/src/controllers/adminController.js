const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const { sendPrintJobUpdate, sendOrderUpdate } = require("../utils/emailService");

const SAFE_ORDER_SELECT = {
  id: true, userId: true, status: true, subtotal: true, discount: true,
  tax: true, total: true, currency: true, paymentMethod: true, paymentId: true,
  notes: true, shippingName: true, shippingEmail: true, shippingPhone: true,
  shippingAddress: true, shippingCity: true, shippingCountry: true, shippingZip: true,
  createdAt: true, updatedAt: true,
};

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  const safe = async (label, fn, fallback) => {
    try {
      return await fn();
    } catch (err) {
      console.error(`[Admin Stats] Query failed — ${label}:`, err.message);
      return fallback;
    }
  };

  try {
    const [
      totalBooks,
      totalUsers,
      totalOrders,
      revenue,
      recentOrders,
      topBooks,
      recentUsers,
      ordersByStatus,
    ] = await Promise.all([
      safe(
        "book.count",
        () => prisma.book.count({ where: { isActive: true } }),
        0,
      ),
      safe(
        "user.count",
        () => prisma.user.count({ where: { role: "USER" } }),
        0,
      ),
      safe("order.count", () => prisma.order.count(), 0),
      safe(
        "order.aggregate revenue",
        () =>
          prisma.order.aggregate({
            where: { status: { in: ["PAID", "DELIVERED", "SHIPPED"] } },
            _sum: { total: true },
          }),
        { _sum: { total: null } },
      ),
      safe(
        "order.findMany recentOrders",
        async () => {
          try {
            return await prisma.order.findMany({
              take: 10,
              orderBy: { createdAt: "desc" },
              include: {
                user: { select: { name: true, email: true, avatar: true } },
                items: { select: { quantity: true } },
              },
            });
          } catch (e) {
            if (e.code === "P2022") {
              return await prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                  ...SAFE_ORDER_SELECT,
                  user: { select: { name: true, email: true, avatar: true } },
                  items: { select: { quantity: true } },
                },
              });
            }
            throw e;
          }
        },
        [],
      ),
      safe(
        "book.findMany topBooks",
        () =>
          prisma.book.findMany({
            take: 5,
            orderBy: { sold: "desc" },
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              sold: true,
              price: true,
              rating: true,
            },
          }),
        [],
      ),
      safe(
        "user.findMany recentUsers",
        () =>
          prisma.user.findMany({
            take: 5,
            where: { role: "USER" },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              createdAt: true,
            },
          }),
        [],
      ),
      safe(
        "order.groupBy status",
        () =>
          prisma.order.groupBy({
            by: ["status"],
            _count: { _all: true },
          }),
        [],
      ),
    ]);

    res.json({
      stats: {
        totalBooks,
        totalUsers,
        totalOrders,
        revenue: Number(revenue._sum.total) || 0,
      },
      recentOrders,
      topBooks,
      recentUsers,
      ordersByStatus,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(search && {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      }),
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
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

// PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    // Prevent self-demotion
    if (req.params.id === req.user.id && role && role !== "ADMIN") {
      throw new AppError("Cannot change your own role", 400);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    res.json({ message: "User updated", user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      throw new AppError("Cannot delete yourself", 400);
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/orders
const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { id: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }),
    };

    let orders, total;
    try {
      [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
            items: {
              include: { book: { select: { title: true, coverImage: true } } },
            },
          },
        }),
        prisma.order.count({ where }),
      ]);
    } catch (queryErr) {
      if (queryErr.code === "P2022") {
        console.warn("[getOrdersAdmin] Schema missing, falling back to safe select...");
        [orders, total] = await Promise.all([
          prisma.order.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            select: {
              ...SAFE_ORDER_SELECT,
              user: { select: { id: true, name: true, email: true, avatar: true } },
              items: {
                select: {
                  id: true, orderId: true, bookId: true, quantity: true, price: true,
                  book: { select: { title: true, coverImage: true } }
                }
              }
            },
          }),
          prisma.order.count({ where }),
        ]);
      } else {
        throw queryErr;
      }
    }

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

// PUT /api/admin/orders/:id
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];
    if (!validStatuses.includes(status))
      throw new AppError("Invalid status", 400);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, status: true, userId: true, user: { select: { email: true } } },
    });

    if (order.user?.email) {
      // Send email out async without awaiting so we don't hold the request
      sendOrderUpdate(order.user.email, order, status).catch(console.error);
    }

    // Update book sold count on delivery
    if (status === "DELIVERED") {
      const items = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });
      for (const item of items) {
        await prisma.book.update({
          where: { id: item.bookId },
          data: {
            sold: { increment: item.quantity },
            stock: { decrement: item.quantity },
          },
        });
      }
    }

    res.json({ message: "Order updated", order });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/print-jobs
const getPrintJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status && { status }),
    };

    const [printJobs, total] = await Promise.all([
      prisma.printJob.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, shippingAddress: true, shippingName: true, status: true } }
        },
      }),
      prisma.printJob.count({ where }),
    ]);

    res.json({
      printJobs,
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

// PUT /api/admin/print-jobs/:id
const updatePrintJob = async (req, res, next) => {
  try {
    const { status, trackingUrl } = req.body;
    
    const validStatuses = [
      "PENDING",
      "PRINTING",
      "QUALITY_CHECK",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED"
    ];

    if (status && !validStatuses.includes(status)) {
      throw new AppError("Invalid print job status", 400);
    }

    const printJob = await prisma.printJob.update({
      where: { id: req.params.id },
      data: { 
        ...(status && { status }),
      },
      include: {
        user: { select: { email: true } }
      }
    });

    if (status && printJob.user?.email) {
      // Trigger email update
      await sendPrintJobUpdate(printJob.user.email, printJob, status, trackingUrl);
    }

    res.json({ message: "Print job updated", printJob });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getOrders,
  updateOrderStatus,
  getPrintJobs,
  updatePrintJob,
};
