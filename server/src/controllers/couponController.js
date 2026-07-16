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

// Pure helper: validate a coupon and compute the discount.
// Returns { valid, discount, coupon, message } on success, or { valid: false, error } on failure.
const calculateCouponDiscount = async (code, subtotal) => {
  if (!code) {
    return { valid: false, error: "Coupon code is required" };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is no longer active" };
  }

  const now = new Date();
  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    return { valid: false, error: "This coupon is not yet valid" };
  }
  if (coupon.validUntil && now > new Date(coupon.validUntil)) {
    return { valid: false, error: "This coupon has expired" };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }

  const orderSubtotal = Number(subtotal) || 0;
  if (coupon.minOrderAmount && orderSubtotal < Number(coupon.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order amount of Rs. ${Number(coupon.minOrderAmount)} required`,
    };
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = (orderSubtotal * Number(coupon.discountValue)) / 100;
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }
  } else {
    discount = Number(coupon.discountValue);
    if (discount > orderSubtotal) {
      discount = orderSubtotal;
    }
  }

  return {
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
  };
};

// POST /api/coupons/validate - Validate and calculate discount
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const result = await calculateCouponDiscount(code, subtotal);

    if (!result.valid) {
      throw new AppError(result.error, 400);
    }

    res.json({
      valid: true,
      coupon: result.coupon,
      discount: result.discount,
      message: result.message,
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
  calculateCouponDiscount,
  applyCoupon,
};
