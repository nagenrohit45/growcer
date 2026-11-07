// Runs non-destructive deployment checks. Supply BASE_URL; no secrets are printed.
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
for (const path of [
  "/",
  "/products/all",
  "/categories",
  "/cart",
  "/checkout",
  "/orders",
  "/offers",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
]) {
  const result = await fetch(base + path);
  if (!result.ok || !(await result.text()).includes('<div id="root">'))
    throw new Error(path + " failed: " + result.status);
  console.log("PASS page", path);
}
for (const path of ["/api/health", "/api/products", "/api/auth/session"]) {
  const result = await fetch(base + path);
  const data = await result.json();
  if (!result.ok || (path.endsWith("health") && data.ok !== true))
    throw new Error(path + " failed: " + result.status);
  console.log("PASS API", path);
}
const privateOrders = await fetch(base + "/api/orders");
if (privateOrders.status !== 401)
  throw new Error("Unauthenticated orders must return 401.");
console.log("PASS account isolation");
