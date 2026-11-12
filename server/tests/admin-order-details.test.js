const assert = require("node:assert/strict");
const { test } = require("node:test");

const prismaPath = require.resolve("../src/config/prisma");
const controllerPath = require.resolve("../src/controllers/adminController");

function setup(options = {}) {
  const queries = [];
  let findManyCalls = 0;
  const prisma = {
    $queryRaw: async (strings) => {
      const sql = strings.join("?");
      return sql.includes("order_items") ? [{ Field: "variationId" }] : [{ table: "available" }];
    },
    order: {
      findMany: async (query) => {
        queries.push({ operation: "findMany", query });
        findManyCalls++;
        if (options.fallback && findManyCalls === 1) {
          throw Object.assign(new Error("Missing schema field"), { code: "P2022" });
        }
        return [{
          id: "order-1",
          notes: null,
          items: [],
          printJobs: [],
        }];
      },
      count: async () => 1,
      update: async (query) => {
        queries.push({ operation: "update", query });
        return {
          id: query.where.id,
          notes: null,
          user: {},
          items: [],
          printJobs: [],
        };
      },
    },
  };

  const previousPrisma = require.cache[prismaPath];
  const previousController = require.cache[controllerPath];
  require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: prisma,
  };
  delete require.cache[controllerPath];
  const controller = require(controllerPath);

  if (previousPrisma) require.cache[prismaPath] = previousPrisma;
  else delete require.cache[prismaPath];
  if (previousController) require.cache[controllerPath] = previousController;
  else delete require.cache[controllerPath];

  return { controller, queries };
}

function createResponse() {
  return {
    body: null,
    json(data) {
      this.body = data;
      return this;
    },
  };
}

test("admin order list includes selected variants and complete print jobs", async () => {
  const { controller, queries } = setup();
  const response = createResponse();

  await controller.getOrders(
    { query: { page: "1", limit: "20" } },
    response,
    (error) => { throw error; },
  );

  const query = queries[0].query;
  assert.equal(query.include.items.include.variation, true);
  assert.equal(query.include.printJobs, true);
  assert.equal(query.include.user.select.phone, true);
  assert.equal(response.body.orders.length, 1);
});

test("admin order fallback retains variants and print jobs when supported", async () => {
  const { controller, queries } = setup({ fallback: true });
  const response = createResponse();

  await controller.getOrders(
    { query: { page: "1", limit: "20" } },
    response,
    (error) => { throw error; },
  );

  const query = queries[1].query;
  assert.equal(query.select.items.select.variationId, true);
  assert.equal(query.select.items.select.variation, true);
  assert.equal(query.select.printJobs, true);
});

test("admin order updates retain variant details for fulfillment", async () => {
  const { controller, queries } = setup();
  const response = createResponse();

  await controller.updateOrderStatus(
    {
      params: { id: "order-1" },
      body: { shippingName: "Buyer" },
    },
    response,
    (error) => { throw error; },
  );

  const query = queries[0].query;
  assert.equal(query.select.items.select.variationId, true);
  assert.equal(query.select.items.select.variation, true);
  assert.equal(query.select.printJobs, true);
});
