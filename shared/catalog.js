// Public catalog metadata is shared by the UI and the API. The API always prices orders.
export const catalog = [
  [
    1,
    "Tomato",
    40,
    "vegetables",
    "1 kg",
    "category-img/vegetables/tomato.webp",
  ],
  [
    2,
    "Potato",
    30,
    "vegetables",
    "per pack",
    "category-img/vegetables/potato.webp",
  ],
  [
    3,
    "Onion",
    35,
    "vegetables",
    "per pack",
    "category-img/vegetables/onion.webp",
  ],
  [
    4,
    "Carrot",
    50,
    "vegetables",
    "per pack",
    "category-img/vegetables/carrot.webp",
  ],
  [
    5,
    "Cabbage",
    45,
    "vegetables",
    "per pack",
    "category-img/vegetables/cabbage.webp",
  ],
  [6, "Apple", 120, "fruits", "1 kg", "category-img/fruits/apple.webp"],
  [7, "Banana", 50, "fruits", "per pack", "category-img/fruits/banana.webp"],
  [8, "Orange", 80, "fruits", "per pack", "category-img/fruits/orange.webp"],
  [9, "Mango", 150, "fruits", "per pack", "category-img/fruits/mango.webp"],
  [10, "Grapes", 90, "fruits", "per pack", "category-img/fruits/grape.webp"],
  [11, "Milk", 55, "dairy", "per pack", "category-img/dairy/milk.webp"],
  [12, "Curd", 40, "dairy", "per pack", "category-img/dairy/curd.webp"],
  [13, "Butter", 60, "dairy", "per pack", "category-img/dairy/butter.webp"],
  [14, "Paneer", 80, "dairy", "per pack", "category-img/dairy/paneer.webp"],
  [15, "Cheese", 120, "dairy", "per pack", "category-img/dairy/cheese.webp"],
  [16, "Rice", 60, "essentials", "1 kg", "category-img/essentials/rice.webp"],
  [
    17,
    "Toor Dal",
    110,
    "essentials",
    "per pack",
    "category-img/essentials/dal.webp",
  ],
  [
    18,
    "Sugar",
    45,
    "essentials",
    "per pack",
    "category-img/essentials/sugar.webp",
  ],
  [
    19,
    "Salt",
    20,
    "essentials",
    "per pack",
    "category-img/essentials/salt.webp",
  ],
  [
    20,
    "Cooking Oil",
    150,
    "essentials",
    "per pack",
    "category-img/essentials/oil.webp",
  ],
  [102, "Milk", 30, "dairy", "500 ml", "products/milk.webp"],
  [103, "Rice", 350, "essentials", "5 kg", "products/rice.webp"],
].map(([id, name, price, category, unit, image]) => ({
  id,
  name,
  price,
  category,
  unit,
  image,
}));

export const coupons = [
  { code: "SAVE10", label: "10% off your basket" },
  { code: "FLAT50", label: "₹50 off, up to your basket value" },
  { code: "FREESHIP", label: "₹30 delivery promotion" },
  { code: "VEG20", label: "20% off vegetables" },
];

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
