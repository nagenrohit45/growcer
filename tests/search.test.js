import { test } from "node:test";
import assert from "node:assert/strict";
import { catalog } from "../shared/catalog.js";
import { getSearchSuggestions } from "../src/lib/search.js";

test("search ignores case and surrounding whitespace", () => {
  assert.deepEqual(
    getSearchSuggestions(catalog, "  ToMaTo  ").map((p) => p.id),
    [1],
  );
  assert.deepEqual(getSearchSuggestions(catalog, "  "), []);
});
test("search distinguishes pack variants and matches category words", () => {
  assert.deepEqual(
    getSearchSuggestions(catalog, "milk 500").map((p) => p.id),
    [102],
  );
  assert.deepEqual(
    getSearchSuggestions(catalog, "rice 5 kg").map((p) => p.id),
    [103],
  );
  assert.equal(getSearchSuggestions(catalog, "vegetables").length, 5);
});
test("suggestions prioritize name prefixes, limit results, and preserve the catalog", () => {
  const original = catalog.map((p) => p.id);
  const matches = getSearchSuggestions(catalog, "t");
  assert.equal(matches.length, 6);
  assert.deepEqual(
    matches.slice(0, 2).map((p) => p.name),
    ["Tomato", "Toor Dal"],
  );
  assert.deepEqual(
    catalog.map((p) => p.id),
    original,
  );
});
test("unmatched searches return no suggestions", () => {
  assert.deepEqual(getSearchSuggestions(catalog, "zzzz-not-a-product"), []);
});
