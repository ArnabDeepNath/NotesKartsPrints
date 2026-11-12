const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");

const prismaPath = require.resolve("../src/config/prisma");
const controllerPath = require.resolve("../src/controllers/bookController");

const categories = [
  { id: "root", slug: "notes", parentId: null },
  { id: "branch", slug: "revision", parentId: "root" },
  { id: "leaf", slug: "anatomy", parentId: "branch" },
  { id: "deep", slug: "anatomy-volume-one", parentId: "leaf" },
  { id: "sibling", slug: "physiology", parentId: "branch" },
  { id: "other-branch", slug: "full-notes", parentId: "root" },
  { id: "other-root", slug: "stationery", parentId: null },
];

const books = [
  { id: "root-book", categoryId: "root", subcategoryId: null },
  { id: "branch-book", categoryId: "branch", subcategoryId: null },
  { id: "leaf-book", categoryId: "branch", subcategoryId: "leaf" },
  { id: "root-leaf-book", categoryId: "root", subcategoryId: "leaf" },
  { id: "primary-leaf-book", categoryId: "leaf", subcategoryId: null },
  { id: "deep-book", categoryId: "leaf", subcategoryId: "deep" },
  { id: "sibling-book", categoryId: "branch", subcategoryId: "sibling" },
  { id: "other-branch-book", categoryId: "other-branch", subcategoryId: null },
  { id: "other-root-book", categoryId: "other-root", subcategoryId: null },
  { id: "unassigned-book", categoryId: null, subcategoryId: null },
  { id: "inactive-leaf-book", categoryId: "branch", subcategoryId: "leaf", isActive: false },
].map((book, index) => ({
  title: book.id,
  author: "Author",
  tags: "revision",
  isActive: true,
  featured: book.id === "leaf-book",
  genreId: "medical",
  price: index + 10,
  ...book,
}));

const leafBookIds = ["leaf-book", "root-leaf-book", "primary-leaf-book", "deep-book"];
const branchBookIds = ["branch-book", ...leafBookIds, "sibling-book"];

function matches(book, where) {
  return Object.entries(where).every(([field, value]) => {
    if (field === "AND") return value.every((condition) => matches(book, condition));
    if (field === "OR") return value.some((condition) => matches(book, condition));
    if (value && typeof value === "object") {
      if (value.in) return value.in.includes(book[field]);
      if (value.contains !== undefined) return String(book[field] || "").includes(value.contains);
      return (value.gte === undefined || book[field] >= value.gte)
        && (value.lte === undefined || book[field] <= value.lte);
    }
    return book[field] === value;
  });
}

function setup(options = {}) {
  const queries = [];
  const schemaQueries = [];
  let columnChecks = 0;
  let bookQueries = 0;
  const prisma = {
    $queryRaw: async (strings) => {
      const sql = strings.join("?");
      schemaQueries.push(sql);
      // Reject the invalid SQL that originally disabled all category filters.
      assert.doesNotMatch(sql, /OR SHOW/);
      if (options.schemaError) throw options.schemaError;
      if (sql.startsWith("SHOW COLUMNS")) {
        assert.equal(sql, "SHOW COLUMNS FROM books WHERE Field IN ('categoryId', 'subcategoryId')");
        columnChecks++;
        const missing = options.missingColumns || (options.missingAfterFailure && columnChecks > 1);
        return missing ? [{ Field: "categoryId" }] : [{ Field: "categoryId" }, { Field: "subcategoryId" }];
      }
      assert.equal(sql, "SHOW TABLES LIKE 'book_variations'");
      return options.missingVariations ? [] : [{ Tables_in_library: "book_variations" }];
    },
    category: {
      findMany: async () => options.categories || categories,
    },
    genre: {
      findUnique: async ({ where }) => where.slug === "medical" ? { id: "medical" } : null,
    },
    book: {
      findMany: async (query) => {
        queries.push(query);
        bookQueries++;
        if (options.queryError && (bookQueries === 1 || options.alwaysFail)) {
          throw Object.assign(new Error("Schema mismatch"), { code: options.queryError });
        }
        return books.filter((book) => matches(book, query.where))
          .slice(query.skip, query.skip + query.take);
      },
      count: async ({ where }) => books.filter((book) => matches(book, where)).length,
      create: async (query) => {
        queries.push(query);
        return { id: "created", ...query.data };
      },
      update: async (query) => {
        queries.push(query);
        return { id: query.where.id, ...query.data };
      },
    },
  };

  // Load a fresh controller and its schema caches with a database-free Prisma stub.
  const previousPrisma = require.cache[prismaPath];
  const previousController = require.cache[controllerPath];
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: prisma };
  delete require.cache[controllerPath];
  const controller = require(controllerPath);
  if (previousPrisma) require.cache[prismaPath] = previousPrisma;
  else delete require.cache[prismaPath];
  if (previousController) require.cache[controllerPath] = previousController;
  else delete require.cache[controllerPath];

  return { controller, queries, schemaQueries };
}

async function request(controller, query, handler = "getBooks", body = {}) {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; },
  };
  await controller[handler]({ query, body, params: { id: "updated" } }, response, (error) => { throw error; });
  return response;
}

function assertBooks(response, expectedIds) {
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.books.map((book) => book.id), expectedIds);
  assert.equal(response.body.pagination.total, expectedIds.length);
}

test("subcategory returns its branch, not its siblings or the full catalog", async () => {
  const { controller, queries } = setup();
  assertBooks(await request(controller, { subcategory: "revision" }), branchBookIds);
  assert.ok(queries[0].include.category);
  assert.ok(queries[0].include.variations);
});

test("sub-subcategory matches both category fields and excludes siblings", async () => {
  const { controller } = setup();
  assertBooks(await request(controller, { subcategory: "anatomy" }), leafBookIds);
});

test("category plus a deep subcategory intersects branches, not exact parent IDs", async () => {
  const { controller } = setup();
  assertBooks(await request(controller, { category: "notes", subcategory: "anatomy" }), leafBookIds);
  assertBooks(await request(controller, { category: "revision", subcategory: "anatomy" }), leafBookIds);
});

test("top-level category includes all descendants but not other roots or unassigned products", async () => {
  const { controller } = setup();
  assertBooks(await request(controller, { category: "notes" }), ["root-book", ...branchBookIds, "other-branch-book"]);
});

test("category parameter also supports a nested category", async () => {
  const { controller } = setup();
  assertBooks(await request(controller, { category: "revision" }), branchBookIds);
});

test("deepest leaf excludes products assigned only to its parent", async () => {
  const { controller } = setup();
  assertBooks(await request(controller, { subcategory: "anatomy-volume-one" }), ["deep-book"]);
});

test("unknown or incompatible category slugs return an empty result", async () => {
  const { controller } = setup();
  for (const query of [
    { category: "unknown" },
    { subcategory: "unknown" },
    { category: "unknown", subcategory: "anatomy" },
    { category: "stationery", subcategory: "anatomy" },
  ]) {
    assertBooks(await request(controller, query), []);
  }
});

test("search, genre, featured and price filters remain combined with the branch", async () => {
  const { controller } = setup();
  assertBooks(await request(controller, { subcategory: "anatomy", search: "primary" }), ["primary-leaf-book"]);
  assertBooks(await request(controller, { subcategory: "revision", genre: "medical", featured: "true" }), ["leaf-book"]);
  assertBooks(await request(controller, { subcategory: "anatomy", minPrice: "13", maxPrice: "14" }), ["root-leaf-book", "primary-leaf-book"]);
});

test("pagination counts only the selected branch", async () => {
  const { controller } = setup();
  const response = await request(controller, { subcategory: "anatomy", page: "2", limit: "2" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.books.map((book) => book.id), leafBookIds.slice(2));
  assert.deepEqual(response.body.pagination, { total: 4, page: 2, limit: 2, totalPages: 2 });
});

test("unfiltered catalog still returns all active products", async () => {
  const { controller } = setup();
  assertBooks(await request(controller, {}), books.filter((book) => book.isActive).map((book) => book.id));
});

for (const code of ["P2021", "P2022"]) {
  test(`${code} safe-select fallback preserves category and search filters`, async () => {
    const { controller, queries } = setup({ queryError: code, missingVariations: true });
    const response = await request(controller, { category: "notes", subcategory: "anatomy", search: "primary" });
    assertBooks(response, ["primary-leaf-book"]);
    assert.equal(queries.length, 2);
    assert.ok(queries[1].select);
    assert.deepEqual(queries[1].where, queries[0].where);
    assert.equal(queries[1].where.AND.length, 2);
  });
}

test("missing category columns produce an error instead of an unfiltered query", async () => {
  const { controller, queries } = setup({ missingColumns: true });
  const response = await request(controller, { subcategory: "anatomy" });
  assert.equal(response.statusCode, 503);
  assert.match(response.body.message, /Category filtering is unavailable/);
  assert.equal(queries.length, 0);
});

test("columns disappearing during fallback never remove the selected filter", async () => {
  const { controller, queries } = setup({ queryError: "P2022", missingAfterFailure: true });
  const response = await request(controller, { subcategory: "anatomy" });
  assert.equal(response.statusCode, 503);
  assert.equal(queries.length, 1);
});

test("repeated schema errors never retry with an unfiltered query", async () => {
  const { controller, queries } = setup({ queryError: "P2022", alwaysFail: true });
  const response = await request(controller, { subcategory: "anatomy" });
  assert.equal(response.statusCode, 500);
  assert.equal(queries.length, 2);
  assert.deepEqual(queries[1].where, queries[0].where);
});

test("transient schema-check failures are not cached as missing columns", async () => {
  const options = { schemaError: new Error("Connection unavailable") };
  const { controller, queries } = setup(options);
  assert.equal((await request(controller, { subcategory: "anatomy" })).statusCode, 500);
  assert.equal(queries.length, 0);
  delete options.schemaError;
  assertBooks(await request(controller, { subcategory: "anatomy" }), leafBookIds);
});

test("branch traversal handles cycles without looping", async () => {
  const cyclicCategories = categories.map((item) => item.id === "branch" ? { ...item, parentId: "deep" } : item);
  const { controller } = setup({ categories: cyclicCategories });
  assertBooks(await request(controller, { subcategory: "revision" }), branchBookIds);
});

test("create and update preserve category assignments after successful schema detection", async () => {
  const { controller, queries } = setup();
  const body = { title: "New book", price: "10", categoryId: "branch", subcategoryId: "leaf" };
  assert.equal((await request(controller, {}, "createBook", body)).statusCode, 201);
  assert.equal((await request(controller, {}, "updateBook", body)).statusCode, 200);
  for (const query of queries) {
    assert.equal(query.data.categoryId, "branch");
    assert.equal(query.data.subcategoryId, "leaf");
  }
});

test("update edits variations in place and preserves their IDs and order links", async () => {
  const { controller, queries } = setup();
  const response = await request(controller, {}, "updateBook", {
    title: "Variant book",
    variations: [
      {
        id: "variation-red",
        attributes: { type: "Color", value: "Red" },
        price: "249.50",
        comparePrice: "299",
        stock: "7",
        sku: "RED-001",
        image: "/uploads/red.jpg",
      },
      {
        attributes: { type: "Color", value: "Blue" },
        price: "259",
        comparePrice: "",
        stock: "4",
      },
    ],
  });

  assert.equal(response.statusCode, 200);
  const variationUpdate = queries[0].data.variations;
  assert.equal(variationUpdate.deleteMany, undefined);
  assert.equal(variationUpdate.update[0].where.id, "variation-red");
  assert.deepEqual(variationUpdate.update[0].data, {
    attributes: { type: "Color", value: "Red" },
    price: 249.5,
    comparePrice: 299,
    stock: 7,
    sku: "RED-001",
    image: "/uploads/red.jpg",
  });
  assert.equal(variationUpdate.create[0].price, 259);
  assert.equal(variationUpdate.create[0].comparePrice, null);
  assert.equal(variationUpdate.create[0].stock, 4);
});

test("variation updates reject invalid prices and fractional stock", async () => {
  const { controller, queries } = setup();
  await assert.rejects(
    request(controller, {}, "updateBook", {
      variations: [{
        id: "variation-red",
        attributes: { type: "Color", value: "Red" },
        price: "249",
        stock: "1.5",
      }],
    }),
    /whole number/,
  );

  assert.equal(queries.length, 0);
});

test("create and update normalize galleries and return image arrays", async () => {
  const { controller, queries } = setup();
  const body = {
    title: "Illustrated book",
    price: "10",
    images: [" /uploads/front.jpg ", "https://example.com/back.jpg", "/uploads/front.jpg"],
  };
  const created = await request(controller, {}, "createBook", body);
  const updated = await request(controller, {}, "updateBook", body);
  const storedImages = JSON.stringify(["/uploads/front.jpg", "https://example.com/back.jpg"]);

  assert.equal(created.statusCode, 201);
  assert.equal(updated.statusCode, 200);
  assert.deepEqual(created.body.book.images, ["/uploads/front.jpg", "https://example.com/back.jpg"]);
  assert.deepEqual(updated.body.book.images, ["/uploads/front.jpg", "https://example.com/back.jpg"]);
  assert.equal(queries[0].data.images, storedImages);
  assert.equal(queries[1].data.images, storedImages);

  const cleared = await request(controller, {}, "updateBook", { images: [] });
  assert.equal(cleared.statusCode, 200);
  assert.equal(queries[2].data.images, null);
  assert.deepEqual(cleared.body.book.images, []);
});

test("HTTP query parameters reach the controller and return only the selected branch", async () => {
  const { controller } = setup();
  const app = express();
  app.get("/api/books", controller.getBooks);
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/books?category=notes&subcategory=anatomy`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.deepEqual(data.books.map((book) => book.id), leafBookIds);
    assert.equal(data.pagination.total, leafBookIds.length);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});