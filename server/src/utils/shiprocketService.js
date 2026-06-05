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

const flattenShiprocketErrors = (errors, prefix = "") => {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors.flatMap((entry) => flattenShiprocketErrors(entry, prefix));
  }

  if (typeof errors === "string") {
    return [prefix ? `${prefix}: ${errors}` : errors];
  }

  if (typeof errors !== "object") {
    return [prefix ? `${prefix}: ${String(errors)}` : String(errors)];
  }

  return Object.entries(errors).flatMap(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenShiprocketErrors(value, nextPrefix);
  });
};

const getShiprocketErrorMessage = (data, fallback) => {
  const detailedErrors = flattenShiprocketErrors(data?.errors).filter(Boolean);

  if (typeof data?.message === "string" && data.message.trim()) {
    const message = data.message.trim();
    if (/invalid email and password combination/i.test(message)) {
      return `${message}. Shiprocket external API requires the API User credentials from Settings > API > Add New API User, not the normal OTP dashboard login.`;
    }

    if (detailedErrors.length > 0) {
      return `${message} ${detailedErrors.join(", ")}`;
    }

    return message;
  }

  if (detailedErrors.length > 0) {
    return detailedErrors.join(", ");
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

const resolveShiprocketAddressParts = (order) => {
  const rawAddress = normalizeCredential(order.shippingAddress);
  const rawZip = normalizeCredential(order.shippingZip);

  const addressZipMatch = rawAddress.match(/(\d{6})(?!.*\d)/);
  const resolvedPincode = rawZip || addressZipMatch?.[1] || "";

  const addressWithoutZip = resolvedPincode
    ? rawAddress
        .replace(new RegExp(`([,\\s-]*)${resolvedPincode}$`), "")
        .trim()
        .replace(/[,-\s]+$/, "")
    : rawAddress;

  const segments = addressWithoutZip
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const state = segments.length > 1 ? segments[segments.length - 1] : "";
  const streetAddress =
    segments.length > 1 ? segments.slice(0, -1).join(", ") : addressWithoutZip;

  return {
    streetAddress,
    state,
    pincode: resolvedPincode,
  };
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
  const addressParts = resolveShiprocketAddressParts(order);

  if (!billingPhone) {
    throw new AppError(
      "Order is missing a valid shipping phone number for Shiprocket. Update the order shipping phone in Admin Logistics and retry.",
      400,
    );
  }

  if (!addressParts.pincode) {
    throw new AppError(
      "Order is missing a valid shipping pincode for Shiprocket. Update the order shipping address in Admin Logistics and retry.",
      400,
    );
  }

  if (!addressParts.state) {
    throw new AppError(
      "Order is missing a valid shipping state for Shiprocket. Include the state in the shipping address and retry.",
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
    billing_address:
      addressParts.streetAddress ||
      order.shippingAddress ||
      "Address unavailable",
    billing_city: order.shippingCity || "City",
    billing_pincode: addressParts.pincode,
    billing_state: addressParts.state,
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

const assignShiprocketAwb = async (token, orderId) => {
  const oid = Number(orderId);
  const payload = {
    oid: Number.isFinite(oid) ? oid : orderId,
  };

  const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
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
      getShiprocketErrorMessage(data, "Shiprocket courier assignment failed"),
      502,
    );
  }

  return data;
};

const extractShiprocketOrderPayload = (orderData) => {
  const candidates = [
    orderData,
    orderData?.response,
    orderData?.response?.data,
    orderData?.data,
    orderData?.data?.response,
    orderData?.data?.data,
  ].filter(Boolean);

  return (
    candidates.find((candidate) => candidate?.order_id || candidate?.orderId) ||
    orderData
  );
};

const extractShiprocketPickupLocations = (data) => {
  const locationEntries = data?.data?.data;

  if (!Array.isArray(locationEntries)) {
    return [];
  }

  return locationEntries
    .map((entry) => normalizeCredential(entry?.pickup_location))
    .filter(Boolean);
};

const mergeShiprocketOrderAndShipment = (orderData, shipmentData) => {
  const orderPayload = extractShiprocketOrderPayload(orderData);
  const shipmentPayload =
    shipmentData?.response?.data || shipmentData?.data || {};

  return {
    ...orderData,
    ...orderPayload,
    shipment_id:
      shipmentPayload.shipment_id ||
      shipmentPayload.shipmentId ||
      orderPayload?.shipment_id ||
      orderPayload?.shipmentId ||
      orderData?.shipment_id ||
      orderData?.shipmentId ||
      null,
    awb_code:
      shipmentPayload.awb_code ||
      shipmentPayload.awbCode ||
      orderPayload?.awb_code ||
      orderPayload?.awbCode ||
      orderData?.awb_code ||
      orderData?.awbCode ||
      null,
    courier_name:
      shipmentPayload.courier_name || shipmentPayload.courierName || null,
    courier_company_id:
      shipmentPayload.courier_company_id ||
      shipmentPayload.courierCompanyId ||
      null,
    shipment_response: shipmentData,
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

  console.log(
    "[Shiprocket] create/adhoc response:",
    JSON.stringify({
      orderId: data?.order_id || data?.orderId || null,
      responseOrderId:
        data?.response?.order_id || data?.response?.orderId || null,
      responseDataOrderId:
        data?.response?.data?.order_id || data?.response?.data?.orderId || null,
      dataOrderId: data?.data?.order_id || data?.data?.orderId || null,
      keys: Object.keys(data || {}),
      responseKeys: Object.keys(data?.response || {}),
      dataKeys: Object.keys(data?.data || {}),
      raw: data,
    }),
  );

  if (/wrong pickup location entered/i.test(data?.message || "")) {
    const pickupLocations = extractShiprocketPickupLocations(data);
    const availableLocations = pickupLocations.length
      ? ` Available pickup locations: ${pickupLocations.join(", ")}.`
      : "";

    throw new AppError(
      `${data.message}. Update the Shiprocket pickup location in Admin Settings > Logistics to exactly match a Shiprocket pickup location.${availableLocations}`,
      400,
    );
  }

  const orderPayload = extractShiprocketOrderPayload(data);
  const shiprocketOrderId = orderPayload?.order_id || orderPayload?.orderId;
  if (!shiprocketOrderId) {
    throw new AppError(
      "Shiprocket order was created but no order ID was returned",
      502,
    );
  }

  const shipmentData = await assignShiprocketAwb(token, shiprocketOrderId);

  return mergeShiprocketOrderAndShipment(data, shipmentData);
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
