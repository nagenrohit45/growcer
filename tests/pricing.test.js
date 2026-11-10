import assert from "node:assert/strict";
import { test } from "node:test";
import { catalog, coupons, priceCart, validateDelivery } from "../shared/catalog.js";
import { readFileSync } from "node:fs";

test("Java API resource and frontend share the same canonical products and coupons", () => {
  const resource = JSON.parse(readFileSync(new URL("../shared/catalog.json", import.meta.url)));
  assert.deepEqual(resource, { products: catalog, coupons });
});
test("discounts are capped, category-specific, and rounded consistently", () => {
  assert.equal(priceCart([{ id: 1, quantity: 1 }], "FLAT50").total, 0);
  assert.equal(priceCart([{ id: 1, quantity: 2 }, { id: 6, quantity: 1 }], "VEG20").discount, 16);
  assert.equal(priceCart([{ id: 6, quantity: 1 }], "VEG20").discount, 0);
  assert.equal(priceCart([{ id: 3, quantity: 1 }], "SAVE10").total, 31.5);
  assert.equal(priceCart([{ id: 1, quantity: 1 }, { id: 1, quantity: 2 }]).items[0].quantity, 3);
});
test("invalid cart and delivery input is rejected", () => {
  for (const items of [[], [{ id: 999, quantity: 1 }], [{ id: 1, quantity: -1 }], [{ id: 1, quantity: 1.5 }], [{ id: 1, quantity: 100 }], [{ id: 1, quantity: 99 }, { id: 1, quantity: 1 }]]) assert.throws(() => priceCart(items));
  assert.throws(() => priceCart([{ id: 1, quantity: 1 }], "HACK"));
  assert.throws(() => validateDelivery({}));
  assert.throws(() => validateDelivery({ name: "AA", address: "123 Sample Street", city: "AB", phone: "12" }));
});
