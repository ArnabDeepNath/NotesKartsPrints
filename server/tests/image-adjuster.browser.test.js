const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const ts = require("typescript");
const { webpack } = require("next/dist/compiled/webpack/webpack");

const chrome = process.env.CHROME_PATH || [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((candidate) => fs.existsSync(candidate));
const root = path.resolve(__dirname, "../..");

// Run the actual React component and browser canvas in Chrome, without a database,
// admin credentials, browser automation dependency, or changes to app routes.
test("image adjuster browser workflow", { skip: !chrome, timeout: 90000 }, async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "basak-image-browser-"));
  let server;
  try {
    const transpile = (relative, output) => {
      const source = fs.readFileSync(path.join(root, relative), "utf8")
        .replace('"@/lib/image-adjuster"', '"./image-adjuster"');
      const result = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
      });
      fs.writeFileSync(path.join(temp, output), result.outputText);
    };
    transpile("src/lib/image-adjuster.ts", "image-adjuster.js");
    transpile("src/app/admin/components/ImageUploadInput.tsx", "ImageUploadInput.js");
    fs.writeFileSync(path.join(temp, "entry.js"), `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import ImageUploadInput from './ImageUploadInput';
      import { drawAdjustedImage } from './image-adjuster';
      const errors = [];
      window.addEventListener('error', event => errors.push(event.message));
      window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      const pause = () => new Promise(resolve => setTimeout(resolve, 20));
      async function waitFor(predicate, message) {
        for (let index = 0; index < 200; index++) { if (predicate()) return; await pause(); }
        throw new Error('Timed out: ' + message);
      }
      const button = text => {
        const buttons = [...document.querySelectorAll('button')];
        const match = buttons.find(item => item.textContent === text);
        check(match, 'Button not found: ' + text + '; available: ' + buttons.map(item => item.textContent).join(', '));
        return match;
      };
      const control = text => {
        const labels = [...document.querySelectorAll('label')];
        const match = labels.find(item => item.textContent.trim().startsWith(text))?.querySelector('input,select');
        check(match, 'Control not found: ' + text);
        return match;
      };
      async function change(element, value) {
        check(element, 'Control not found');
        const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await pause();
      }
      let submitted = [];
      let rejectUpload = false;
      const root = createRoot(document.getElementById('root'));
      const render = (existingImage, disabled = false) => root.render(React.createElement(ImageUploadInput, {
        existingImage, disabled,
        onReady: async file => {
          if (rejectUpload) throw new Error('Test upload failed');
          submitted.push(file);
        }
      }));
      render();
      async function run() {
        await waitFor(() => document.querySelector('input[type=file]'), 'file picker');
        const originalCanvas = document.createElement('canvas');
        originalCanvas.width = 120; originalCanvas.height = 80;
        const context = originalCanvas.getContext('2d');
        context.fillStyle = '#ff0000'; context.fillRect(0, 0, 60, 80);
        context.fillStyle = '#0000ff'; context.fillRect(60, 0, 60, 80);
        const blob = await new Promise(resolve => originalCanvas.toBlob(resolve, 'image/png'));
        const original = new File([blob], 'sample.png', { type: 'image/png' });
        const open = async file => {
          const picker = document.querySelector('input[type=file]');
          picker.focus();
          const transfer = new DataTransfer(); transfer.items.add(file);
          picker.files = transfer.files;
          picker.dispatchEvent(new Event('change', { bubbles: true }));
          await waitFor(() => document.querySelector('[role=dialog]'), 'editor');
          await waitFor(() => document.querySelector('canvas') || document.querySelector('[role=alert]'), 'image decode');
          await pause();
        };
        await open(original);
        check(submitted.length === 0, 'File was submitted before confirmation');
        check(document.body.style.overflow === 'hidden', 'Page scrolling not locked');
        check(control('width (px)').value === '120' && control('height (px)').value === '80', 'Original dimensions incorrect');
        await change(control('Crop ratio'), '1');
        check(control('width (px)').value === '80' && control('height (px)').value === '80', 'Square crop dimensions incorrect');
        await change(control('Horizontal position'), '1');
        let pixel = document.querySelector('canvas').getContext('2d').getImageData(70, 40, 1, 1).data;
        check(pixel[2] > 240 && pixel[0] < 10, 'Crop preview did not move to blue side');
        await change(control('Zoom'), '2');
        await change(control('width (px)'), '40');
        check(control('height (px)').value === '40', 'Aspect-locked resize failed');
        button('Rotate 90°').click(); await pause();
        button('Flip horizontal').click(); await pause();
        check(button('Flip horizontal').getAttribute('aria-pressed') === 'true', 'Flip state not updated');
        button('Reset').click(); await pause();
        check(control('width (px)').value === '120' && control('Zoom').value === '1', 'Reset failed');
        await change(control('Crop ratio'), 'custom');
        await change(control('Ratio width'), '2');
        await change(control('Ratio height'), '3');
        check(Math.abs(Number(control('width (px)').value) / Number(control('height (px)').value) - 2 / 3) < 0.01, 'Custom crop failed');
        await change(control('width (px)'), '60');
        check(control('height (px)').value === '91' || control('height (px)').value === '90', 'Custom resize failed');
        control('Lock output aspect ratio').click(); await pause();
        await change(control('height (px)'), '70');
        check(control('width (px)').value === '60', 'Unlocked resize changed width');
        await change(control('File format'), 'image/jpeg');
        await change(control('Quality'), '0.8');
        button('Use adjusted image').click();
        await waitFor(() => !document.querySelector('[role=dialog]'), 'editor confirmation');
        check(submitted.length === 1 && submitted[0].type === 'image/jpeg', 'JPEG file not submitted');
        check(submitted[0].name === 'sample-adjusted.jpg', 'Output filename incorrect');
        const decoded = await createImageBitmap(submitted[0]);
        check(decoded.width === 60 && decoded.height === 70, 'Export dimensions incorrect');
        decoded.close();
        check(document.body.style.overflow === '', 'Page scrolling not restored');
        await open(original);
        button('Cancel').click(); await pause();
        // Exercise saved images over real HTTP, including cross-origin CORS.
        await fetch('/saved-cover.png', { method: 'POST', body: blob });
        render('/saved-cover.png'); await pause();
        button('Edit existing image').focus();
        button('Edit existing image').click();
        await waitFor(() => document.querySelector('canvas'), 'saved image decode');
        check(control('width (px)').value === '120' && control('height (px)').value === '80', 'Saved image dimensions incorrect');
        await change(control('Crop ratio'), '1');
        await change(control('Horizontal position'), '1');
        await change(control('Brightness'), '50');
        await change(control('Contrast'), '100');
        await change(control('width (px)'), '40');
        pixel = document.querySelector('canvas').getContext('2d').getImageData(35, 20, 1, 1).data;
        check(pixel[2] >= 125 && pixel[2] <= 130 && pixel[0] < 10, 'Saved image crop or brightness preview incorrect');
        await change(control('Contrast'), '50');
        pixel = document.querySelector('canvas').getContext('2d').getImageData(35, 20, 1, 1).data;
        check(pixel[0] >= 60 && pixel[0] <= 65, 'Saved image contrast adjustment incorrect');
        await change(control('Contrast'), '100');
        button('Use adjusted image').click();
        await waitFor(() => !document.querySelector('[role=dialog]'), 'saved image export');
        check(submitted.length === 2 && submitted[1].name === 'saved-cover-adjusted.png', 'Saved image not exported');
        const saved = await createImageBitmap(submitted[1]);
        check(saved.width === 40 && saved.height === 40, 'Saved image crop/resize export incorrect');
        const exportedCanvas = document.createElement('canvas'); exportedCanvas.width = 40; exportedCanvas.height = 40;
        exportedCanvas.getContext('2d').drawImage(saved, 0, 0); saved.close();
        pixel = exportedCanvas.getContext('2d').getImageData(35, 20, 1, 1).data;
        check(pixel[2] >= 125 && pixel[2] <= 130 && pixel[0] < 10, 'Saved export does not match preview');
        check(document.activeElement === button('Edit existing image'), 'Saved image editor did not restore focus');
        render(location.origin.replace('127.0.0.1', 'localhost') + '/saved-cover.png'); await pause();
        button('Edit existing image').click();
        await waitFor(() => document.querySelector('canvas'), 'cross-origin saved image');
        button('Use adjusted image').click();
        await waitFor(() => !document.querySelector('[role=dialog]'), 'cross-origin export');
        check(submitted.length === 3, 'CORS image could not be exported');
        render('/retry-cover.png'); await pause();
        button('Edit existing image').click();
        await waitFor(() => document.querySelector('[role=alert]'), 'saved image fetch error');
        check(document.querySelector('[role=alert]').textContent.includes('HTTP 404'), 'Saved image error missing');
        check(button('Use adjusted image').disabled, 'Failed saved image can be submitted');
        button('Retry loading').click();
        await waitFor(() => document.querySelector('canvas'), 'saved image retry');
        button('Cancel').click(); await pause();
        check(submitted.length === 3, 'Saved image cancel changed the image');
        render('/not-an-image'); await pause(); button('Edit existing image').click();
        await waitFor(() => document.querySelector('[role=alert]'), 'non-image URL');
        check(document.querySelector('[role=alert]').textContent.includes('does not contain an image'), 'Non-image URL error missing');
        button('Cancel').click(); await pause();
        render('/slow-cover.png'); await pause(); button('Edit existing image').click();
        await waitFor(() => document.querySelector('[role=dialog]'), 'pending saved image');
        check(button('Use adjusted image').disabled, 'Loading image can be submitted');
        button('Cancel').click(); await pause();
        check(!document.querySelector('[role=dialog]') && document.body.style.overflow === '', 'Loading cancel failed');
        render(original); await pause(); button('Edit existing image').click();
        await waitFor(() => document.querySelector('canvas'), 'pending local category image');
        button('Cancel').click(); await pause();
        render('/saved-cover.png', true); await pause();
        check(button('Edit existing image').disabled && document.querySelector('input[type=file]').disabled, 'Disabled controls still editable');
        render(''); await pause();
        check(![...document.querySelectorAll('button')].some(item => item.textContent === 'Edit existing image'), 'Empty URL has an edit button');
        check(!document.querySelector('[role=dialog]') && submitted.length === 3, 'Cancel changed the image');
        await open(original);
        rejectUpload = true;
        button('Use adjusted image').click();
        await waitFor(() => document.querySelector('[role=alert]'), 'upload error');
        check(document.querySelector('[role=alert]').textContent.includes('Test upload failed'), 'Upload error missing');
        check(!!document.querySelector('[role=dialog]'), 'Upload failure closed editor');
        rejectUpload = false;
        button('Use adjusted image').click();
        await waitFor(() => !document.querySelector('[role=dialog]'), 'upload retry');
        check(submitted.length === 4 && submitted[3].type === 'image/png', 'PNG retry failed');
        await open(original);
        await change(control('File format'), 'image/webp');
        button('Use adjusted image').click();
        await waitFor(() => !document.querySelector('[role=dialog]'), 'WebP export');
        check(submitted.length === 5 && submitted[4].type === 'image/webp', 'WebP export failed');
        await open(original);
        document.querySelector('[role=dialog]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await pause();
        check(!document.querySelector('[role=dialog]') && submitted.length === 5, 'Escape did not cancel editing');
        await open(new File(['not an image'], 'broken.png', { type: 'image/png' }));
        check(document.querySelector('[role=alert]').textContent.includes('cannot be opened'), 'Invalid image error missing');
        check(button('Use adjusted image').disabled, 'Invalid image can be submitted');
        button('Cancel').click(); await pause();
        // Validate real canvas rotation/flip against colored source pixels.
        const image = new Image(); image.src = originalCanvas.toDataURL(); await image.decode();
        const result = document.createElement('canvas');
        const defaults = { aspect: 2 / 3, zoom: 1, positionX: .5, positionY: .5, rotation: 90, flipHorizontal: false, brightness: 100, contrast: 100 };
        drawAdjustedImage(result, image, defaults, { width: 80, height: 120 }, 'image/png');
        pixel = result.getContext('2d').getImageData(40, 10, 1, 1).data;
        check(pixel[0] > 240 && pixel[2] < 10, 'Real canvas rotation incorrect');
        drawAdjustedImage(result, image, { ...defaults, rotation: 0, aspect: 1.5, flipHorizontal: true }, { width: 120, height: 80 }, 'image/webp');
        pixel = result.getContext('2d').getImageData(10, 40, 1, 1).data;
        check(pixel[2] > 240 && pixel[0] < 10, 'Real canvas flip incorrect');
        check(errors.length === 0, 'Browser errors: ' + errors.join('; '));
        document.getElementById('result').textContent = 'PASS: new and saved images, crop, zoom, resize, brightness, contrast, rotate, flip, custom ratio, JPEG/PNG/WebP export, CORS export, cancel, Escape, reselection, upload/load retry, invalid file/URL, loading cancellation, disabled controls';
      }
      run().catch(error => { document.getElementById('result').textContent = 'FAIL: ' + error.stack; });
    `);
    const compiler = webpack({
      mode: "development", devtool: false, target: "web",
      entry: path.join(temp, "entry.js"),
      output: { path: temp, filename: "bundle.js" },
      resolve: { modules: [path.join(root, "node_modules")], extensions: [".js"] },
    });
    try {
      await new Promise((resolve, reject) => compiler.run((error, stats) => {
        if (error) reject(error);
        else if (stats.hasErrors()) reject(new Error(stats.toString({ all: false, errors: true })));
        else resolve();
      }));
    } finally {
      await new Promise((resolve, reject) => compiler.close((error) => error ? reject(error) : resolve()));
    }
    const html = path.join(temp, "test.html");
    fs.writeFileSync(html, '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><pre id="result">RUNNING</pre><script src="bundle.js"></script></body></html>');
    let fixture;
    let retryCount = 0;
    server = http.createServer(async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (req.method === "POST" && req.url === "/saved-cover.png") {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        fixture = Buffer.concat(chunks);
        res.end("OK");
      } else if (req.url === "/retry-cover.png" && retryCount++ === 0) {
        res.writeHead(404); res.end("Missing image");
      } else if (["/saved-cover.png", "/retry-cover.png", "/slow-cover.png"].includes(req.url)) {
        res.setHeader("Content-Type", "image/png");
        if (req.url === "/slow-cover.png") setTimeout(() => res.end(fixture), 500);
        else res.end(fixture);
      } else if (req.url === "/bundle.js") {
        res.setHeader("Content-Type", "application/javascript"); res.end(fs.readFileSync(path.join(temp, "bundle.js")));
      } else {
        res.setHeader("Content-Type", "text/html"); res.end(fs.readFileSync(html));
      }
    });
    await new Promise(resolve => server.listen(0, resolve));
    const profile = path.join(temp, "profile");
    const child = spawn(chrome, ["--headless=new", "--no-first-run", "--disable-gpu",
      `--user-data-dir=${profile}`, "--remote-debugging-port=0", `http://127.0.0.1:${server.address().port}`], { stdio: "ignore" });
    const closed = new Promise((resolve) => child.once("close", resolve));
    let socket;
    try {
      const portFile = path.join(profile, "DevToolsActivePort");
      let port;
      for (let attempt = 0; !port && attempt < 100; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        try {
          port = fs.readFileSync(portFile, "utf8").split("\n")[0];
        } catch (error) {
          if (!["ENOENT", "EBUSY"].includes(error.code)) throw error;
        }
      }
      assert.ok(port, "Chrome debugging port unavailable");
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const target = targets.find((item) => item.type === "page");
      assert.ok(target, "Chrome test page unavailable");
      socket = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve, { once: true });
        socket.addEventListener("error", reject, { once: true });
      });
      let id = 0;
      const evaluate = () => new Promise((resolve, reject) => {
        const requestId = ++id;
        const timeout = setTimeout(() => reject(new Error("Chrome evaluation timed out")), 5000);
        const receive = (event) => {
          const response = JSON.parse(event.data);
          if (response.id !== requestId) return;
          clearTimeout(timeout);
          socket.removeEventListener("message", receive);
          resolve(response.result?.result?.value || "RUNNING");
        };
        socket.addEventListener("message", receive);
        socket.send(JSON.stringify({ id: requestId, method: "Runtime.evaluate",
          params: { expression: "document.getElementById('result')?.textContent", returnByValue: true } }));
      });
      let result = "RUNNING";
      for (let attempt = 0; result === "RUNNING" && attempt < 200; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        result = await evaluate();
      }
      assert.match(result, /^PASS:/, result);
      console.log(result);
    } finally {
      socket?.close();
      child.kill();
      await closed;
    }
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});