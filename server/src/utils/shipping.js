const SHIPPING_METHODS = Object.freeze({
  STANDARD: "STANDARD",
  EXPRESS: "EXPRESS",
});

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeShippingMethod = (value) => {
  const method = String(value || SHIPPING_METHODS.STANDARD).toUpperCase();
  if (!Object.values(SHIPPING_METHODS).includes(method)) {
    throw new Error("Unsupported shipping method");
  }
  return method;
};

const calculateShipping = (subtotal, pricing = {}, requestedMethod) => {
  const normalizedSubtotal = Number(subtotal);
  if (!Number.isFinite(normalizedSubtotal) || normalizedSubtotal < 0) {
    throw new Error("Invalid subtotal for shipping calculation");
  }

  const method = normalizeShippingMethod(requestedMethod);
  const standardShippingCost = Math.max(0, Number(pricing.shippingCost) || 0);
  const freeShippingThreshold = Math.max(
    0,
    Number(pricing.freeShippingThreshold) || 0,
  );
  const expressShippingPercent = Math.max(
    0,
    Number(pricing.expressShippingPercent) || 0,
  );

  const charge =
    method === SHIPPING_METHODS.EXPRESS
      ? roundMoney(normalizedSubtotal * (expressShippingPercent / 100))
      : normalizedSubtotal >= freeShippingThreshold
        ? 0
        : roundMoney(standardShippingCost);

  return {
    method,
    charge,
    expressShippingPercent,
    freeShippingThreshold,
  };
};

module.exports = {
  SHIPPING_METHODS,
  calculateShipping,
  normalizeShippingMethod,
};
