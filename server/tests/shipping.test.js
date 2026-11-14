const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  SHIPPING_METHODS,
  calculateShipping,
  normalizeShippingMethod,
} = require("../src/utils/shipping");

const pricing = {
  shippingCost: 49,
  freeShippingThreshold: 499,
  expressShippingPercent: 12.5,
};

test("standard shipping keeps the configured flat fee below the threshold", () => {
  const result = calculateShipping(400, pricing, "STANDARD");
  assert.equal(result.method, SHIPPING_METHODS.STANDARD);
  assert.equal(result.charge, 49);
});

test("standard shipping is free at and above the threshold", () => {
  assert.equal(calculateShipping(499, pricing, "STANDARD").charge, 0);
  assert.equal(calculateShipping(750, pricing, "STANDARD").charge, 0);
});

test("express shipping uses the pre-tax subtotal and remains chargeable", () => {
  const result = calculateShipping(1000, pricing, "EXPRESS");
  assert.equal(result.method, SHIPPING_METHODS.EXPRESS);
  assert.equal(result.charge, 125);
  assert.equal(result.expressShippingPercent, 12.5);
});

test("express shipping rounds to two decimal places", () => {
  assert.equal(
    calculateShipping(123.45, { ...pricing, expressShippingPercent: 7.5 }, "EXPRESS").charge,
    9.26,
  );
});

test("shipping method defaults to standard and is case-insensitive", () => {
  assert.equal(normalizeShippingMethod(), "STANDARD");
  assert.equal(normalizeShippingMethod("express"), "EXPRESS");
});

test("invalid shipping methods and subtotals are rejected", () => {
  assert.throws(() => calculateShipping(100, pricing, "OVERNIGHT"), /Unsupported shipping method/);
  assert.throws(() => calculateShipping(-1, pricing, "STANDARD"), /Invalid subtotal/);
  assert.throws(() => calculateShipping("not-a-number", pricing, "STANDARD"), /Invalid subtotal/);
});
