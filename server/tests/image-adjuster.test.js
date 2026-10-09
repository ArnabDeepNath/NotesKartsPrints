const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Use the project's existing TypeScript compiler; no additional test runner.
const sourcePath = require.resolve("../../src/lib/image-adjuster.ts");
const javascript = ts.transpileModule(readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
const browser = { exports: exportsObject, File, Blob, URL, Math, Number, Promise, Error, Set };
vm.runInNewContext(javascript, browser, { filename: sourcePath });
const {
  getCropRect, getRotatedSize, fitImageSize, resizeImageSize, moveCrop,
  drawAdjustedImage, exportAdjustedImage, loadImageFile, MAX_IMAGE_DIMENSION, MAX_UPLOAD_BYTES,
} = exportsObject;

function adjustments(overrides = {}) {
  return { aspect: 1, zoom: 1, positionX: 0.5, positionY: 0.5, rotation: 0,
    flipHorizontal: false, brightness: 100, contrast: 100, ...overrides };
}

const plain = (value) => JSON.parse(JSON.stringify(value));

test("existing image loader preserves bytes, type and decoded filename without query parameters", async () => {
  const controller = new AbortController();
  browser.fetch = async (url, options) => {
    assert.equal(url, "https://example.com/uploads/old%20cover.png?v=1");
    assert.equal(options.signal, controller.signal);
    return new Response(new Blob(["original bytes"], { type: "image/png" }));
  };
  const file = await loadImageFile("https://example.com/uploads/old%20cover.png?v=1", controller.signal);
  assert.equal(file.name, "old cover.png");
  assert.equal(file.type, "image/png");
  assert.equal(await file.text(), "original bytes");
});

test("existing image loader supports relative URLs and generic image responses", async () => {
  browser.fetch = async () => new Response(new Blob(["bytes"], { type: "application/octet-stream" }));
  assert.equal((await loadImageFile("/uploads/images/cover.jpg")).name, "cover.jpg");
  assert.equal((await loadImageFile("/uploads/images/bad%name.png")).name, "existing-image");
});

test("existing image loader reports missing, empty and non-image URLs", async () => {
  browser.fetch = async () => new Response(null, { status: 404 });
  await assert.rejects(loadImageFile("/missing.png"), /HTTP 404/);
  browser.fetch = async () => new Response(new Blob([], { type: "image/png" }));
  await assert.rejects(loadImageFile("/empty.png"), /does not contain an image/);
  browser.fetch = async () => new Response("<html>Not an image</html>", { headers: { "Content-Type": "text/html" } });
  await assert.rejects(loadImageFile("/page"), /does not contain an image/);
});

test("existing image loader explains CORS failures and preserves cancellation", async () => {
  browser.fetch = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(loadImageFile("https://external.example/cover.png"), /CORS.*Upload & Adjust/);
  const controller = new AbortController();
  controller.abort();
  browser.fetch = async () => { throw controller.signal.reason; };
  await assert.rejects(loadImageFile("/cover.png", controller.signal), (error) => error === controller.signal.reason);
});

function canvasMock(blob = new Blob(["image"], { type: "image/png" })) {
  const calls = [];
  const context = {};
  for (const method of ["save", "restore", "clearRect", "fillRect", "scale", "translate", "rotate", "drawImage"]) {
    context[method] = (...args) => calls.push([method, ...args]);
  }
  const canvas = {
    width: 0, height: 0,
    getContext: () => context,
    toBlob: (callback, format, quality) => {
      calls.push(["toBlob", format, quality]);
      callback(blob);
    },
  };
  return { canvas, context, calls };
}

test("square crop is centered and retains only the chosen part of a landscape image", () => {
  assert.deepEqual(plain(getCropRect({ width: 1200, height: 800 }, adjustments())),
    { x: 200, y: 0, width: 800, height: 800 });
});

test("original aspect retains the whole image", () => {
  assert.deepEqual(plain(getCropRect({ width: 1200, height: 800 }, adjustments({ aspect: 1.5 }))),
    { x: 0, y: 0, width: 1200, height: 800 });
});

test("zoom and positioning select the expected source rectangle", () => {
  assert.deepEqual(plain(getCropRect({ width: 1200, height: 800 }, adjustments({ zoom: 2, positionX: 1, positionY: 0 }))),
    { x: 800, y: 0, width: 400, height: 400 });
});

test("crop stays within bounds across portrait, landscape, zoom and position combinations", () => {
  for (const size of [{ width: 1200, height: 800 }, { width: 500, height: 1800 }]) {
    for (const aspect of [2 / 3, 1, 16 / 9, 0.01, 100]) {
      for (const rotation of [0, 90, 180, 270]) {
        for (const zoom of [0, 1, 3, 8]) {
          const rotated = getRotatedSize(size, rotation);
          const crop = getCropRect(size, adjustments({ aspect, rotation, zoom, positionX: 10, positionY: -10 }));
          assert.ok(crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0);
          assert.ok(crop.x + crop.width <= rotated.width + 0.00001);
          assert.ok(crop.y + crop.height <= rotated.height + 0.00001);
          assert.ok(Math.abs(crop.width / crop.height - aspect) < 0.00001);
        }
      }
    }
  }
});

test("quarter turns swap dimensions and half turns preserve them", () => {
  const size = { width: 1200, height: 800 };
  assert.deepEqual(plain(getRotatedSize(size, 90)), { width: 800, height: 1200 });
  assert.deepEqual(plain(getRotatedSize(size, 270)), { width: 800, height: 1200 });
  assert.deepEqual(plain(getRotatedSize(size, 180)), size);
});

test("image dimensions fit the maximum proportionally without enlarging small images", () => {
  assert.deepEqual(plain(fitImageSize({ width: 8000, height: 4000 })), { width: 4096, height: 2048 });
  assert.deepEqual(plain(fitImageSize({ width: 300, height: 600 })), { width: 300, height: 600 });
  assert.deepEqual(plain(fitImageSize({ width: 1, height: 12000 })), { width: 1, height: 4096 });
});

test("locked resizing preserves aspect while unlocked resizing changes only one dimension", () => {
  const size = { width: 1200, height: 800 };
  assert.deepEqual(plain(resizeImageSize(size, "width", 600, true)), { width: 600, height: 400 });
  assert.deepEqual(plain(resizeImageSize(size, "height", 400, true)), { width: 600, height: 400 });
  assert.deepEqual(plain(resizeImageSize(size, "height", 400, false)), { width: 1200, height: 400 });
  assert.deepEqual(plain(resizeImageSize(size, "width", 9999, true)), { width: 4096, height: 2731 });
});

test("invalid resize values are clamped to positive dimensions", () => {
  const size = { width: 100, height: 100 };
  for (const value of [0, -10, NaN]) {
    assert.deepEqual(plain(resizeImageSize(size, "width", value, true)), { width: 1, height: 1 });
  }
});

test("dragging moves the crop in the correct direction and clamps at image edges", () => {
  const size = { width: 1200, height: 800 };
  const display = { width: 400, height: 400 };
  assert.deepEqual(plain(moveCrop(size, adjustments(), 100, 50, display)), { positionX: 0, positionY: 0.5 });
  assert.deepEqual(plain(moveCrop(size, adjustments(), -1000, -1000, display)), { positionX: 1, positionY: 0.5 });
  assert.deepEqual(plain(moveCrop(size, adjustments({ zoom: 2 }), 100, 100, display)), { positionX: 0.375, positionY: 0.25 });
});

test("canvas rendering applies crop, rotation, flip and color adjustments", () => {
  const { canvas, context, calls } = canvasMock();
  const image = { naturalWidth: 1200, naturalHeight: 800 };
  drawAdjustedImage(canvas, image, adjustments({ rotation: 90, flipHorizontal: true, brightness: 120, contrast: 80 }),
    { width: 600, height: 600 }, "image/png");
  assert.equal(canvas.width, 600);
  assert.equal(canvas.height, 600);
  assert.equal(context.filter, "brightness(120%) contrast(80%)");
  assert.equal(context.imageSmoothingQuality, "high");
  assert.ok(calls.some(([method, x, y]) => method === "scale" && x === -1 && y === 1));
  assert.ok(calls.some(([method, angle]) => method === "rotate" && angle === Math.PI / 2));
  assert.ok(calls.some(([method, x, y]) => method === "translate" && x === 0 && y === -200));
  assert.equal(calls.at(-1)[0], "restore");
  assert.ok(!calls.some(([method]) => method === "fillRect"));
});

test("JPEG uses a white background while PNG preserves transparency", () => {
  const { canvas, context, calls } = canvasMock();
  drawAdjustedImage(canvas, { naturalWidth: 100, naturalHeight: 100 }, adjustments(), { width: 50, height: 50 }, "image/jpeg");
  assert.equal(context.fillStyle, "#ffffff");
  assert.deepEqual(calls.find(([method]) => method === "fillRect"), ["fillRect", 0, 0, 50, 50]);
});

test("export produces an adjusted file with the actual MIME type and requested quality", async () => {
  const { canvas, calls } = canvasMock(new Blob(["adjusted bytes"], { type: "image/webp" }));
  browser.document = { createElement: () => canvas };
  const file = await exportAdjustedImage({ naturalWidth: 1000, naturalHeight: 1000 }, "my.cover.jpg", adjustments(),
    { width: 500, height: 500 }, "image/webp", 0.8);
  assert.equal(file.name, "my.cover-adjusted.webp");
  assert.equal(file.type, "image/webp");
  assert.equal(await file.text(), "adjusted bytes");
  assert.deepEqual(calls.find(([method]) => method === "toBlob"), ["toBlob", "image/webp", 0.8]);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test("export handles browsers falling back to PNG and clamps quality", async () => {
  const { canvas, calls } = canvasMock();
  browser.document = { createElement: () => canvas };
  const file = await exportAdjustedImage({ naturalWidth: 100, naturalHeight: 100 }, "photo.jpg", adjustments(),
    { width: 50, height: 50 }, "image/webp", 20);
  assert.equal(file.name, "photo-adjusted.png");
  assert.equal(file.type, "image/png");
  assert.equal(calls.find(([method]) => method === "toBlob")[2], 1);
});

test("export rejects dimensions outside canvas limits", async () => {
  for (const width of [0, -1, MAX_IMAGE_DIMENSION + 1, 1.5]) {
    await assert.rejects(exportAdjustedImage({}, "photo.jpg", adjustments(), { width, height: 100 }, "image/jpeg", 0.9), /dimensions/);
  }
});

test("export rejects files above the upload limit and releases the canvas", async () => {
  const { canvas } = canvasMock({ size: MAX_UPLOAD_BYTES + 1, type: "image/png" });
  browser.document = { createElement: () => canvas };
  await assert.rejects(exportAdjustedImage({ naturalWidth: 100, naturalHeight: 100 }, "photo.png", adjustments(),
    { width: 100, height: 100 }, "image/png", 0.9), /exceeds 10 MB/);
  assert.equal(canvas.width, 0);
});

test("export reports encoding failure and unsupported canvas", async () => {
  const { canvas } = canvasMock(null);
  browser.document = { createElement: () => canvas };
  await assert.rejects(exportAdjustedImage({ naturalWidth: 100, naturalHeight: 100 }, "photo.png", adjustments(),
    { width: 100, height: 100 }, "image/png", 0.9), /Unable to export/);
  canvas.getContext = () => null;
  await assert.rejects(exportAdjustedImage({ naturalWidth: 100, naturalHeight: 100 }, "photo.png", adjustments(),
    { width: 100, height: 100 }, "image/png", 0.9), /does not support/);
});