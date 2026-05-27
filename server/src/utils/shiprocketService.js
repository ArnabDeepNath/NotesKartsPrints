const { AppError } = require("../middleware/errorHandler");
const { getSiteSettings } = require("./siteSettings");

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let cachedTokenExpiry = 0;

const getShiprocketToken = async () => {
  const settings = await getSiteSettings();
  const { shiprocketEnabled, shiprocketEmail, shiprocketPassword } =
    settings.logistics;

  if (!shiprocketEnabled) {
    throw new AppError("Shiprocket integration is disabled", 400);
  }

  if (!shiprocketEmail || !shiprocketPassword) {
    throw new AppError("Shiprocket credentials are incomplete", 400);
  }

  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return { token: cachedToken, settings };
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: shiprocketEmail,
      password: shiprocketPassword,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) {
    throw new AppError(data.message || "Shiprocket authentication failed", 502);
  }

  cachedToken = data.token;
  cachedTokenExpiry = Date.now() + 8 * 60 * 60 * 1000;

  return { token: cachedToken, settings };
};

const buildShiprocketOrderPayload = (order, settings) => {
  const items = (order.items || []).map((item) => ({
    name: item.book?.title || `Book ${item.bookId}`,
    sku: item.bookId,
    units: item.quantity,
    selling_price: Number(item.price),
  }));

  if (order.printJobs?.length) {
    for (const job of order.printJobs) {
      items.push({
        name: job.fileName || `Print Job ${job.id}`,
        sku: job.id,
        units: Number(job.copies || 1),
        selling_price: Number(job.price || 0),
      });
    }
  }

  return {
    order_id: order.id,
    order_date: new Date(order.createdAt || Date.now())
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
    pickup_location: settings.logistics.pickupLocation || "Primary",
    channel_id: settings.logistics.channelId || undefined,
    billing_customer_name: order.shippingName || order.user?.name || "Customer",
    billing_last_name: "",
    billing_address: order.shippingAddress || "Address unavailable",
    billing_city: order.shippingCity || "City",
    billing_pincode: order.shippingZip || "000000",
    billing_state: "NA",
    billing_country: order.shippingCountry || "India",
    billing_email: order.shippingEmail || order.user?.email || "",
    billing_phone: order.shippingPhone || "0000000000",
    shipping_is_billing: true,
    order_items: items,
    payment_method:
      String(order.paymentMethod || "prepaid").toLowerCase() === "cod"
        ? "COD"
        : "Prepaid",
    sub_total: Number(order.subtotal || 0),
    shipping_charges: 0,
    total_discount: Number(order.discount || 0),
    total: Number(order.total || 0),
    length: 10,
    breadth: 10,
    height: 4,
    weight: 0.5,
  };
};

const createShiprocketOrder = async (order) => {
  const { token, settings } = await getShiprocketToken();
  const payload = buildShiprocketOrderPayload(order, settings);

  const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError(data.message || "Shiprocket order creation failed", 502);
  }

  return data;
};

const getShiprocketTracking = async (shipmentId) => {
  const { token } = await getShiprocketToken();

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/courier/track/shipment/${shipmentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError(
      data.message || "Shiprocket tracking lookup failed",
      502,
    );
  }

  return data;
};

module.exports = {
  createShiprocketOrder,
  getShiprocketTracking,
};
