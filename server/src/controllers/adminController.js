const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const {
  sendPrintJobUpdate,
  sendOrderUpdate,
} = require("../utils/emailService");
const { mergeOrderNotes, parseOrderNotes } = require("../utils/orderNotes");
const {
  createShiprocketOrder,
  getShiprocketTracking,
} = require("../utils/shiprocketService");

const SAFE_ORDER_SELECT = {
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
};

const safeAdminLoginLogsQuery = async (operation, fallback) => {
  try {
    return await operation();
  } catch (error) {
    if (error.code === "P2021" || error.code === "P2022") {
      console.warn("[Admin Login Logs] Schema not ready yet.");
      return fallback;
    }
    throw error;
  }
};

const toShiprocketMeta = (payload, fallbackStatus) => ({
  orderId: payload?.order_id || payload?.orderId || null,
  shipmentId: payload?.shipment_id || payload?.shipmentId || null,
  awbCode:
    payload?.awb_code ||
    payload?.awbCode ||
    payload?.tracking_data?.awb_code ||
    null,
  trackingUrl:
    payload?.tracking_url ||
    payload?.trackingUrl ||
    payload?.tracking_data?.track_url ||
    null,
  status:
    payload?.status ||
    payload?.tracking_data?.track_status ||
    fallbackStatus ||
    null,
  raw: payload,
});

const extractTrackingStatus = (
  trackingPayload,
  existingMeta,
  fallbackStatus,
) => {
  const trackingData = trackingPayload?.tracking_data;
  const shipmentTrack = Array.isArray(trackingData?.shipment_track)
    ? trackingData.shipment_track[0]
    : null;

  return {
    ...existingMeta,
    awbCode:
      shipmentTrack?.awb_code ||
      trackingData?.awb_code ||
      existingMeta?.awbCode ||
      null,
    trackingUrl: trackingData?.track_url || existingMeta?.trackingUrl || null,
    status:
      shipmentTrack?.current_status ||
      trackingData?.track_status ||
      trackingPayload?.status ||
      existingMeta?.status ||
      fallbackStatus ||
      null,
    rawTrack: trackingPayload,
  };
};

const decorateOrderWithShiprocket = (order) => ({
  ...order,
  shiprocket: parseOrderNotes(order.notes).shiprocket || null,
});

const ADMIN_ORDER_DETAIL_SELECT = {
  id: true,
  status: true,
  userId: true,
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
  user: { select: { id: true, email: true, name: true } },
  items: {
    select: {
      id: true,
      bookId: true,
      quantity: true,
      price: true,
      book: { select: { title: true, coverImage: true } },
    },
  },
  printJobs: {
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      pages: true,
      copies: true,
      price: true,
      status: true,
    },
  },
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
      recentAdminLogins,
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
      safe(
        "adminLoginLog.findMany recentAdminLogins",
        () =>
          safeAdminLoginLogsQuery(
            () =>
              prisma.adminLoginLog.findMany({
                take: 6,
                orderBy: { createdAt: "desc" },
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              }),
            [],
          ),
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
      recentAdminLogins,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/login-logs
const getAdminLoginLogs = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await safeAdminLoginLogsQuery(
      () =>
        prisma.adminLoginLog.findMany({
          take: Math.min(Number(limit) || 50, 100),
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
      [],
    );

    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/login-logs/:id/location
const updateAdminLoginLogLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracyMeters } = req.body;

    if (
      typeof latitude !== "number" ||
      Number.isNaN(latitude) ||
      typeof longitude !== "number" ||
      Number.isNaN(longitude)
    ) {
      throw new AppError("Valid latitude and longitude are required", 400);
    }

    const existingLog = await safeAdminLoginLogsQuery(
      () =>
        prisma.adminLoginLog.findFirst({
          where: { id: req.params.id, userId: req.user.id },
          select: { id: true },
        }),
      null,
    );

    if (!existingLog) {
      throw new AppError("Login log not found", 404);
    }

    const log = await safeAdminLoginLogsQuery(
      () =>
        prisma.adminLoginLog.update({
          where: { id: existingLog.id },
          data: {
            latitude,
            longitude,
            accuracyMeters:
              typeof accuracyMeters === "number" &&
              !Number.isNaN(accuracyMeters)
                ? accuracyMeters
                : null,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
      null,
    );

    if (!log) {
      throw new AppError("Login log not found", 404);
    }

    res.json({ message: "Location captured", log });
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
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            items: {
              include: { book: { select: { title: true, coverImage: true } } },
            },
          },
        }),
        prisma.order.count({ where }),
      ]);
    } catch (queryErr) {
      if (queryErr.code === "P2022") {
        console.warn(
          "[getOrdersAdmin] Schema missing, falling back to safe select...",
        );
        [orders, total] = await Promise.all([
          prisma.order.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            select: {
              ...SAFE_ORDER_SELECT,
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
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
            },
          }),
          prisma.order.count({ where }),
        ]);
      } else {
        throw queryErr;
      }
    }

    orders = orders.map(decorateOrderWithShiprocket);

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
      select: {
        id: true,
        status: true,
        userId: true,
        subtotal: true,
        discount: true,
        total: true,
        createdAt: true,
        paymentMethod: true,
        notes: true,
        shippingName: true,
        shippingEmail: true,
        shippingPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingCountry: true,
        shippingZip: true,
        user: { select: { email: true, name: true } },
        items: {
          select: {
            bookId: true,
            quantity: true,
            price: true,
            book: { select: { title: true } },
          },
        },
        printJobs: {
          select: {
            id: true,
            fileName: true,
            copies: true,
            price: true,
          },
        },
      },
    });

    if (["PROCESSING", "SHIPPED"].includes(status)) {
      const meta = parseOrderNotes(order.notes);
      if (!meta.shiprocket?.orderId) {
        try {
          const shiprocket = await createShiprocketOrder(order);
          await prisma.order.update({
            where: { id: order.id },
            data: {
              notes: mergeOrderNotes(order.notes, {
                shiprocket: {
                  orderId: shiprocket.order_id || shiprocket.orderId || null,
                  shipmentId:
                    shiprocket.shipment_id || shiprocket.shipmentId || null,
                  status: shiprocket.status || status,
                  raw: shiprocket,
                },
              }),
            },
          });
        } catch (shiprocketErr) {
          console.error(
            "[Shiprocket] Failed to create shipment:",
            shiprocketErr.message,
          );
        }
      }
    }

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

// POST /api/admin/orders/:id/shiprocket
const createOrderShipment = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: ADMIN_ORDER_DETAIL_SELECT,
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const currentMeta = parseOrderNotes(order.notes).shiprocket;
    if (currentMeta?.shipmentId || currentMeta?.orderId) {
      res.json({
        message: "Shipment already created",
        shiprocket: currentMeta,
        order: decorateOrderWithShiprocket(order),
      });
      return;
    }

    const shipment = await createShiprocketOrder(order);
    const shiprocketMeta = toShiprocketMeta(shipment, order.status);

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: mergeOrderNotes(order.notes, {
          shiprocket: shiprocketMeta,
        }),
      },
      select: ADMIN_ORDER_DETAIL_SELECT,
    });

    res.json({
      message: "Shipment created successfully",
      shiprocket: shiprocketMeta,
      order: decorateOrderWithShiprocket(updatedOrder),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/orders/:id/shiprocket/track
const refreshOrderShipmentTracking = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: ADMIN_ORDER_DETAIL_SELECT,
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const currentMeta = parseOrderNotes(order.notes).shiprocket;
    if (!currentMeta?.shipmentId) {
      throw new AppError("Create the shipment before tracking it", 400);
    }

    const trackingPayload = await getShiprocketTracking(currentMeta.shipmentId);
    const shiprocketMeta = extractTrackingStatus(
      trackingPayload,
      currentMeta,
      order.status,
    );

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        notes: mergeOrderNotes(order.notes, {
          shiprocket: shiprocketMeta,
        }),
      },
      select: ADMIN_ORDER_DETAIL_SELECT,
    });

    res.json({
      message: "Tracking refreshed",
      shiprocket: shiprocketMeta,
      order: decorateOrderWithShiprocket(updatedOrder),
    });
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
          order: {
            select: {
              id: true,
              shippingAddress: true,
              shippingName: true,
              status: true,
            },
          },
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
      "CANCELLED",
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
        user: { select: { email: true } },
      },
    });

    if (status && printJob.user?.email) {
      // Trigger email update
      await sendPrintJobUpdate(
        printJob.user.email,
        printJob,
        status,
        trackingUrl,
      );
    }

    res.json({ message: "Print job updated", printJob });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getAdminLoginLogs,
  getUsers,
  updateUser,
  deleteUser,
  getOrders,
  createOrderShipment,
  refreshOrderShipmentTracking,
  updateOrderStatus,
  getPrintJobs,
  updatePrintJob,
  updateAdminLoginLogLocation,
};
