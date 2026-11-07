import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { newDb } from "pg-mem";
import { createHandler } from "../server/app.js";
import { priceCart, validateDelivery } from "../shared/catalog.js";
import { createDatabase } from "../server/db.js";

const memory = newDb();
const db = new (memory.adapters.createPg().Pool)();
const server = createServer(createHandler(db));
let base, cookie, orderId;
before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = "http://127.0.0.1:" + server.address().port + "/api";
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.end();
});
async function request(
  path,
  method = "GET",
  body,
  session = cookie,
  key = "test-order-request-0001",
  extraHeaders = {},
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Cookie: session } : {}),
      "Idempotency-Key": key,
      ...extraHeaders,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await response.json() };
}
const customer = {
  name: "Test Shopper",
  phone: "9999999999",
  address: "123 Sample Street",
  city: "Hyderabad",
};
const orderBody = {
  items: [{ id: 1, quantity: 1, price: -999 }],
  coupon: "FLAT50",
  customer,
  payment: "cod",
};

test("pricing caps discounts and only discounts eligible vegetables", () => {
  assert.equal(priceCart([{ id: 1, quantity: 1 }], "FLAT50").total, 0);
  assert.equal(
    priceCart(
      [
        { id: 1, quantity: 2 },
        { id: 6, quantity: 1 },
      ],
      "VEG20",
    ).discount,
    16,
  );
  assert.equal(priceCart([{ id: 6, quantity: 1 }], "VEG20").discount, 0);
  assert.equal(
    priceCart([
      { id: 1, quantity: 1 },
      { id: 1, quantity: 2 },
    ]).items[0].quantity,
    3,
  );
  assert.equal(priceCart([{ id: 3, quantity: 1 }], "SAVE10").total, 31.5);
});
test("invalid carts, unknown coupons, and invalid delivery are rejected", () => {
  for (const items of [
    [],
    null,
    [{ id: 999, quantity: 1 }],
    [{ id: 1, quantity: -1 }],
    [{ id: 1, quantity: 1.5 }],
    [{ id: 1, quantity: 100 }],
    [
      { id: 1, quantity: 99 },
      { id: 1, quantity: 1 },
    ],
  ])
    assert.throws(() => priceCart(items));
  assert.throws(() => priceCart([{ id: 1, quantity: 1 }], "HACK"));
  assert.throws(() => validateDelivery({ ...customer, phone: "abc" }));
  assert.throws(() => validateDelivery({ ...customer, name: "  " }));
});
test("catalog is public and order APIs require authentication", async () => {
  assert.equal(
    (await request("/products", "GET", undefined, null)).data.products.length,
    22,
  );
  assert.equal(
    (await request("/orders", "GET", undefined, null)).response.status,
    401,
  );
  assert.equal(
    (await request("/auth/session", "GET", undefined, null)).data.user,
    null,
  );
});
test("Vercel query-based rewrites and nested API paths resolve correctly", async () => {
  assert.equal(
    (await request("?route=products", "GET", undefined, null)).data.products
      .length,
    22,
  );
  assert.equal(
    (await request("?route=auth/session", "GET", undefined, null)).data.user,
    null,
  );
  let payload;
  await createHandler(db)(
    { url: "/api", query: { route: ["products"] }, method: "GET", headers: {} },
    {
      setHeader() {},
      end(value) {
        payload = JSON.parse(value);
      },
    },
  );
  assert.equal(payload.products.length, 22);
});
test("production cannot silently use the in-memory test database", async () => {
  const original = {
    NODE_ENV: process.env.NODE_ENV,
    GROWCER_TEST_DB: process.env.GROWCER_TEST_DB,
    DATABASE_URL: process.env.DATABASE_URL,
  };
  try {
    process.env.NODE_ENV = "production";
    process.env.GROWCER_TEST_DB = "memory";
    delete process.env.DATABASE_URL;
    await assert.rejects(createDatabase(), /DATABASE_URL/);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
test("cross-origin mutations are rejected", async () => {
  const result = await request(
    "/auth/login",
    "POST",
    { email: "test@example.com", password: "password123" },
    null,
    undefined,
    { Origin: "https://other.example" },
  );
  assert.equal(result.response.status, 403);
});
test("register, session cookie, login and duplicate-account validation", async () => {
  const result = await request(
    "/auth/register",
    "POST",
    {
      email: "TEST@example.com",
      password: "password123",
      name: "Test Shopper",
    },
    null,
  );
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  cookie = result.response.headers.get("set-cookie").split(";")[0];
  assert.match(
    result.response.headers.get("set-cookie"),
    /HttpOnly; SameSite=Lax/,
  );
  assert.equal(result.data.user.email, "test@example.com");
  assert.equal(
    (await request("/auth/session")).data.user.email,
    "test@example.com",
  );
  assert.equal(
    (
      await request(
        "/auth/register",
        "POST",
        {
          email: "test@example.com",
          password: "password123",
          name: "Test Shopper",
        },
        null,
      )
    ).response.status,
    409,
  );
  assert.equal(
    (
      await request(
        "/auth/login",
        "POST",
        { email: "test@example.com", password: "incorrect" },
        null,
      )
    ).response.status,
    401,
  );
});
test("server ignores submitted prices, saves authoritative totals, and returns a durable receipt", async () => {
  const result = await request("/orders", "POST", orderBody);
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  assert.equal(result.data.order.subtotal, 40);
  assert.equal(result.data.order.discount, 40);
  assert.equal(result.data.order.total, 0);
  assert.equal(result.data.order.paymentStatus, "due_on_delivery");
  orderId = result.data.order.id;
  assert.equal((await request("/orders/" + orderId)).data.order.id, orderId);
  assert.equal((await request("/orders")).data.orders.length, 1);
});
test("idempotency prevents duplicate orders, including concurrent submissions", async () => {
  const repeat = await request("/orders", "POST", orderBody);
  assert.equal(repeat.response.status, 200);
  assert.equal(repeat.data.order.id, orderId);
  const key = "concurrent-request-key-0001";
  const results = await Promise.all([
    request("/orders", "POST", orderBody, cookie, key),
    request("/orders", "POST", orderBody, cookie, key),
  ]);
  assert.equal(results[0].data.order.id, results[1].data.order.id);
  assert.equal((await request("/orders")).data.orders.length, 2);
});
test("card decline does not create an order; approved simulation does", async () => {
  const declined = await request(
    "/orders",
    "POST",
    { ...orderBody, payment: "card", simulation: "declined" },
    cookie,
    "declined-request-0001",
  );
  assert.equal(declined.response.status, 402);
  assert.equal((await request("/orders")).data.orders.length, 2);
  const approved = await request(
    "/orders",
    "POST",
    { ...orderBody, payment: "card", simulation: "approved" },
    cookie,
    "approved-request-0001",
  );
  assert.equal(approved.response.status, 201);
  assert.equal(approved.data.order.paymentStatus, "simulated_paid");
  assert.equal(approved.data.order.simulation, true);
});
test("server rejects malformed input and unsupported methods", async () => {
  for (const changes of [
    { items: [] },
    { coupon: "HACK" },
    { customer: { ...customer, phone: "no" } },
    { payment: "wire" },
  ]) {
    assert.equal(
      (
        await request(
          "/orders",
          "POST",
          { ...orderBody, ...changes },
          cookie,
          crypto.randomUUID(),
        )
      ).response.status,
      400,
    );
  }
  assert.equal((await request("/auth/login", "GET")).response.status, 405);
  const invalid = await fetch(base + "/orders", {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: "{invalid",
  });
  assert.equal(invalid.status, 400);
});
test("orders are private to their owner", async () => {
  const other = await request(
    "/auth/register",
    "POST",
    {
      email: "other@example.com",
      password: "password123",
      name: "Other Shopper",
    },
    null,
  );
  const otherCookie = other.response.headers.get("set-cookie").split(";")[0];
  assert.equal(
    (await request("/orders/" + orderId, "GET", undefined, otherCookie))
      .response.status,
    404,
  );
  assert.equal(
    (await request("/orders", "GET", undefined, otherCookie)).data.orders
      .length,
    0,
  );
});
test("logout revokes the server session and login issues a new one", async () => {
  assert.equal(
    (await request("/auth/logout", "POST", {})).response.status,
    200,
  );
  assert.equal((await request("/auth/session")).data.user, null);
  assert.equal((await request("/orders")).response.status, 401);
  const login = await request(
    "/auth/login",
    "POST",
    { email: "test@example.com", password: "password123" },
    null,
  );
  assert.equal(login.response.status, 200);
  cookie = login.response.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/orders/" + orderId)).response.status, 200);
});
test("expired sessions cannot access orders", async () => {
  await db.query("UPDATE sessions SET expires_at = $1", [
    new Date("2000-01-01"),
  ]);
  assert.equal((await request("/orders")).response.status, 401);
});
test("authentication attempts are rate limited in the database", async () => {
  let result;
  for (let n = 0; n < 16; n++)
    result = await request(
      "/auth/login",
      "POST",
      { email: "limit@example.com", password: "wrongpassword" },
      null,
    );
  assert.equal(result.response.status, 429);
});
