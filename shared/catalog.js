import metadata from "./catalog.json" with { type: "json" };

export const catalog = metadata.products;
export const coupons = metadata.coupons;

export function priceCart(items, coupon = "") {
  if (!Array.isArray(items) || !items.length || items.length > 50)
    throw new Error("Add at least one product to your cart.");
  if (
    typeof coupon !== "string" ||
    (coupon && !coupons.some((c) => c.code === coupon))
  )
    throw new Error("This coupon is not valid.");
  const quantities = new Map();
  for (const item of items) {
    const id = Number(item.id);
    if (
      !catalog.some((p) => p.id === id) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      throw new Error("Your cart contains an invalid product or quantity.");
    const quantity = (quantities.get(id) || 0) + item.quantity;
    if (quantity > 99) throw new Error("A product can have at most 99 units.");
    quantities.set(id, quantity);
  }
  const lines = [...quantities].map(([id, quantity]) => {
    const { name, price, unit, category } = catalog.find((p) => p.id === id);
    return {
      id,
      name,
      price,
      unit,
      category,
      quantity,
      lineTotal: price * quantity,
    };
  });
  const subtotal = lines.reduce((sum, p) => sum + p.lineTotal, 0);
  const vegetableSubtotal = lines
    .filter((p) => p.category === "vegetables")
    .reduce((sum, p) => sum + p.lineTotal, 0);
  const raw =
    coupon === "SAVE10"
      ? subtotal * 0.1
      : coupon === "FLAT50"
        ? 50
        : coupon === "FREESHIP"
          ? 30
          : coupon === "VEG20"
            ? vegetableSubtotal * 0.2
            : 0;
  const discount = Math.min(subtotal, Math.round(raw * 100) / 100);
  return {
    items: lines,
    subtotal,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
    coupon,
  };
}

export function validateDelivery(input = {}) {
  const result = {};
  for (const [key, min, max] of [
    ["name", 2, 100],
    ["address", 8, 300],
    ["city", 2, 100],
  ]) {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if (value.length < min || value.length > max)
      throw new Error(
        `Please enter a valid ${key} (${min}–${max} characters).`,
      );
    result[key] = value;
  }
  const phone =
    typeof input.phone === "string" ? input.phone.replace(/[\s()-]/g, "") : "";
  if (!/^\+?[0-9]{10,15}$/.test(phone))
    throw new Error("Enter a valid phone number with 10–15 digits.");
  result.phone = phone;
  return result;
}
