const assert = require("node:assert/strict");
const { test } = require("node:test");

const prismaPath = require.resolve("../src/config/prisma");
const controllerPath = require.resolve("../src/controllers/userController");

function createResponse() {
  return {
    body: null,
    json(data) {
      this.body = data;
      return this;
    },
  };
}

test("customer orders expose safe tracking fields and an AWB fallback link", async () => {
  const prisma = {
    order: {
      findMany: async () => [{
        id: "order-1",
        notes: JSON.stringify({
          shiprocket: {
            shipmentId: "shipment-1",
            awbCode: "AWB 123",
            status: "In Transit",
            raw: { courier_name: "Test Courier", secret: "do-not-expose" },
            rawTrack: { internal: "do-not-expose" },
          },
        }),
        items: [],
        printJobs: [],
      }],
      count: async () => 1,
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

  try {
    const response = createResponse();
    await controller.getUserOrders(
      { user: { id: "user-1" }, query: { page: "1", limit: "10" } },
      response,
      (error) => { throw error; },
    );

    assert.deepEqual(response.body.orders[0].shiprocket, {
      shipmentId: "shipment-1",
      awbCode: "AWB 123",
      trackingUrl: "https://shiprocket.co/tracking/AWB%20123",
      status: "In Transit",
      courierName: "Test Courier",
    });
    assert.equal(response.body.orders[0].shiprocket.raw, undefined);
    assert.equal(response.body.orders[0].shiprocket.rawTrack, undefined);
  } finally {
    if (previousPrisma) require.cache[prismaPath] = previousPrisma;
    else delete require.cache[prismaPath];
    if (previousController) require.cache[controllerPath] = previousController;
    else delete require.cache[controllerPath];
  }
});
