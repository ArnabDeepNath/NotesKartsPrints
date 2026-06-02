const { AppError } = require("../middleware/errorHandler");
const { getSiteSettings } = require("./siteSettings");

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let cachedTokenExpiry = 0;

const normalizeCredential = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  const normalized = String(value)
    .replace(/^\uFEFF/, "")
    .replace(/[\r\n]+/g, "")
    .trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
};

const getShiprocketErrorMessage = (data, fallback) => {
  if (typeof data?.message === "string" && data.message.trim()) {
    const message = data.message.trim();
    if (/invalid email and password combination/i.test(message)) {
      return `${message}. Shiprocket external API requires the API User credentials from Settings > API > Add New API User, not the normal OTP dashboard login.`;
    }

    return message;
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (typeof entry?.message === "string") {
          return entry.message;
        }

        return JSON.stringify(entry);
      })
      .join(", ");
  }

  return fallback;
};

const getConfiguredShiprocketToken = (settings) => {
  const rawToken = normalizeCredential(settings.logistics.shiprocketToken);
  if (!rawToken) {
    return null;
  }

  return rawToken;
};

const normalizeShiprocketPhone = (phone, country) => {
  const digits = normalizeCredential(phone).replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  const normalizedCountry = normalizeCredential(country).toLowerCase();
  const isIndia = !normalizedCountry || normalizedCountry === "india";

  if (isIndia) {
    if (digits.length === 10) {
      return digits;
    }

    if (digits.length === 11 && digits.startsWith("0")) {
      return digits.slice(-10);
    }

    if (digits.length >= 12 && digits.startsWith("91")) {
      return digits.slice(-10);
    }
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return digits;
  }

  return "";
};

const getShiprocketToken = async () => {
  const settings = await getSiteSettings();
  const { shiprocketEnabled } = settings.logistics;
  const shiprocketEmail = normalizeCredential(
    settings.logistics.shiprocketEmail,
  );
  const shiprocketPassword = normalizeCredential(
    settings.logistics.shiprocketPassword,
  );
  const configuredToken = getConfiguredShiprocketToken(settings);

  if (!shiprocketEnabled) {
    throw new AppError("Shiprocket integration is disabled", 400);
  }

  if (configuredToken) {
    return { token: configuredToken, settings };
  }

  if (!shiprocketEmail || !shiprocketPassword) {
    throw new AppError(
      "Configure either a Shiprocket API token or email/password credentials",
      400,
    );
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
    throw new AppError(
      getShiprocketErrorMessage(data, "Shiprocket authentication failed"),
      502,
    );
  }

  cachedToken = data.token;
  cachedTokenExpiry = Date.now() + 8 * 60 * 60 * 1000;

  return { token: cachedToken, settings };
};

const buildShiprocketOrderPayload = (order, settings) => {
  const billingPhone = normalizeShiprocketPhone(
    order.shippingPhone || order.user?.phone,
    order.shippingCountry,
  );

  if (!billingPhone) {
    throw new AppError(
      "Order is missing a valid shipping phone number for Shiprocket",
      400,
    );
  }

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
    billing_phone: billingPhone,
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
    throw new AppError(
      getShiprocketErrorMessage(data, "Shiprocket order creation failed"),
      502,
    );
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
      getShiprocketErrorMessage(data, "Shiprocket tracking lookup failed"),
      502,
    );
  }

  return data;
};

module.exports = {
  createShiprocketOrder,
  getShiprocketTracking,
};
