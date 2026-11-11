const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseBookImages, serializeBookImages } = require("../src/utils/bookImages");

test("product images accept arrays and remove empty or duplicate URLs", () => {
  assert.deepEqual(
    parseBookImages([" /uploads/front.jpg ", "", "https://example.com/back.jpg", "/uploads/front.jpg", 42]),
    ["/uploads/front.jpg", "https://example.com/back.jpg"],
  );
});

test("product images parse stored JSON and legacy delimited values", () => {
  const expected = ["/uploads/front.jpg", "/uploads/back.jpg"];
  assert.deepEqual(parseBookImages(JSON.stringify(expected)), expected);
  assert.deepEqual(parseBookImages("/uploads/front.jpg,/uploads/back.jpg"), expected);
  assert.deepEqual(parseBookImages("/uploads/front.jpg\n/uploads/back.jpg"), expected);
  assert.deepEqual(parseBookImages("/uploads/front.jpg"), ["/uploads/front.jpg"]);
});

test("product image serialization is stable and supports clearing the gallery", () => {
  assert.equal(serializeBookImages(undefined), undefined);
  assert.equal(serializeBookImages([]), null);
  assert.equal(serializeBookImages(null), null);
  assert.equal(
    serializeBookImages(["/uploads/front.jpg", "/uploads/front.jpg", "/uploads/back.jpg"]),
    JSON.stringify(["/uploads/front.jpg", "/uploads/back.jpg"]),
  );
  assert.deepEqual(parseBookImages(null), []);
  assert.deepEqual(parseBookImages("[not valid JSON"), ["[not valid JSON"]);
});
