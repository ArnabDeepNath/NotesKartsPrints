const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  buildShiprocketOrderPayload,
} = require("../src/utils/shiprocketService");

test("Shiprocket items include the purchased variant attributes and SKU", () => {
  const payload = buildShiprocketOrderPayload(
    {
      id: "order-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      shippingName: "Buyer",
      shippingEmail: "buyer@example.com",
      shippingPhone: "9876543210",
      shippingAddress: "123 Main Street, West Bengal",
      shippingCity: "Kolkata",
      shippingCountry: "India",
      shippingZip: "700001",
      paymentMethod: "razorpay",
      subtotal: 499,
      discount: 0,
      total: 499,
      items: [{
        bookId: "book-1",
        variationId: "variation-red",
        quantity: 2,
        price: 249.5,
        book: { title: "Medical Notes" },
        variation: {
          sku: "NOTES-RED-HC",
          attributes: {
            type: "Format",
            value: "Hardcover",
            color: "Red",
          },
        },
      }],
      printJobs: [],
    },
    {
      logistics: {
        pickupLocation: "Primary",
        channelId: "",
      },
    },
  );

  assert.equal(payload.order_items.length, 1);
  assert.equal(
    payload.order_items[0].name,
    "Medical Notes (Format: Hardcover, color: Red)",
  );
  assert.equal(payload.order_items[0].sku, "NOTES-RED-HC");
  assert.equal(payload.order_items[0].units, 2);
  assert.equal(payload.order_items[0].selling_price, 249.5);
});
