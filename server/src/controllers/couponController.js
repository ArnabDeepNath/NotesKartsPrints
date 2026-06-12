const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// GET /api/coupons - List all coupons (admin)
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
};

// GET /api/coupons/:id - Get single coupon
const getCoupon = async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: req.params.id },
    });
    if (!coupon) throw new AppError("Coupon not found", 404);
    res.json({ coupon });
  } catch (err) {
    next(err);
  }
};

// POST /api/coupons - Create coupon (admin)
const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      maxUses,
      validFrom,
      validUntil,
      isActive,
    } = req.body;

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType: discountType || "PERCENTAGE",
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ message: "Coupon created", coupon });
  } catch (err) {
    if (err.code === "P2002") {
      return next(new AppError("Coupon code already exists", 400));
    }
    next(err);
  }
};

// PUT /api/coupons/:id - Update coupon (admin)
const updateCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      maxUses,
      validFrom,
      validUntil,
      isActive,
    } = req.body;

    const data = {};
    if (code !== undefined) data.code = code.toUpperCase();
    if (description !== undefined) data.description = description;
    if (discountType !== undefined) data.discountType = discountType;
    if (discountValue !== undefined) data.discountValue = Number(discountValue);
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount ? Number(minOrderAmount) : null;
    if (maxDiscount !== undefined) data.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (maxUses !== undefined) data.maxUses = maxUses ? Number(maxUses) : null;
    if (validFrom !== undefined) data.validFrom = new Date(validFrom);
    if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ message: "Coupon updated", coupon });
  } catch (err) {
    if (err.code === "P2002") {
      return next(new AppError("Coupon code already exists", 400));
    }
    if (err.code === "P2025") {
      return next(new AppError("Coupon not found", 404));
    }
    next(err);
  }
};

// DELETE /api/coupons/:id - Delete coupon (admin)
const deleteCoupon = async (req, res, next) => {
  try {
    await prisma.coupon.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(new AppError("Coupon not found", 404));
    }
    next(err);
  }
};

// POST /api/coupons/validate - Validate and calculate discount
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      throw new AppError("Coupon code is required", 400);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new AppError("Invalid coupon code", 400);
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      throw new AppError("This coupon is no longer active", 400);
    }

    // Check validity dates
    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      throw new AppError("This coupon is not yet valid", 400);
    }
    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      throw new AppError("This coupon has expired", 400);
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new AppError("This coupon has reached its usage limit", 400);
    }

    // Check minimum order amount
    const orderSubtotal = Number(subtotal) || 0;
    if (coupon.minOrderAmount && orderSubtotal < Number(coupon.minOrderAmount)) {
      throw new AppError(
        `Minimum order amount of Rs. ${Number(coupon.minOrderAmount)} required`,
        400
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (orderSubtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      // FIXED
      discount = Number(coupon.discountValue);
      if (discount > orderSubtotal) {
        discount = orderSubtotal;
      }
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
      },
      discount: Math.round(discount * 100) / 100,
      message: `Coupon applied! You save Rs. ${discount.toFixed(2)}`,
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to apply coupon and increment usage
const applyCoupon = async (couponCode, orderId) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.toUpperCase() },
  });

  if (coupon) {
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  return coupon;
};

module.exports = {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
};
