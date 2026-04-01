const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// POST /api/payment/create-checkout-session
const createCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            book: { select: { title: true, coverImage: true, price: true } },
          },
        },
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (order.userId !== req.user.id) throw new AppError("Access denied", 403);
    if (order.status !== "PENDING")
      throw new AppError("Order already processed", 400);

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.book.title,
          images: item.book.coverImage ? [item.book.coverImage] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100), // Stripe uses paise
      },
      quantity: item.quantity,
    }));

    // Add tax line item
    if (Number(order.tax) > 0) {
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: { name: "GST (18%)" },
          unit_amount: Math.round(Number(order.tax) * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: order.user.email,
      line_items: lineItems,
      metadata: { orderId: order.id, userId: req.user.id },
      success_url: `${CLIENT_URL}/user/orders/${order.id}?payment=success`,
      cancel_url: `${CLIENT_URL}/checkout?cancelled=true`,
    });

    // Store session ID on order
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
};

// POST /api/payment/webhook  (called by Stripe — raw body required)
const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { orderId } = session.metadata;

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paymentId: session.payment_intent,
            paymentMethod: "stripe",
          },
        });
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        if (session.metadata?.orderId) {
          await prisma.order.update({
            where: { id: session.metadata.orderId },
            data: { status: "CANCELLED" },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/payment/verify/:sessionId
const verifyPayment = async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
    );
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: req.params.sessionId },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (order.userId !== req.user.id) throw new AppError("Access denied", 403);

    res.json({
      paid: session.payment_status === "paid",
      orderId: order.id,
      status: order.status,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCheckoutSession, stripeWebhook, verifyPayment };
