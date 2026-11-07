import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import {
  catalog,
  coupons,
  priceCart,
  validateDelivery,
} from "../shared/catalog.js";
import { createDatabase, initializeDatabase } from "./db.js";

const scrypt = promisify(scryptCallback);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const safeUser = (row) => ({ id: row.id, email: row.email, name: row.name });
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const requireMethod = (req, method) => {
  if (req.method !== method) throw new ApiError(405, "Method not allowed.");
};

async function readBody(req) {
  if (!(req.headers["content-type"] || "").includes("application/json"))
    throw new ApiError(415, "Send a JSON request.");
  if (req.body !== undefined) {
    if (Buffer.byteLength(JSON.stringify(req.body)) > 16384)
      throw new ApiError(413, "Request is too large.");
    try {
      return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      throw new ApiError(400, "Invalid JSON.");
    }
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 16384)
      throw new ApiError(413, "Request is too large.");
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(400, "Invalid JSON.");
  }
}

export function createHandler(providedDb) {
  let ready;
  const database = () =>
    (ready ||= (async () => {
      const db = providedDb || (await createDatabase());
      await initializeDatabase(db);
      return db;
    })().catch((error) => {
      ready = undefined;
      throw error;
    }));

  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status, body) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    };
    try {
      const url = new URL(req.url, "http://localhost");
      const rewritten = req.query?.route;
      const routeValue =
        (Array.isArray(rewritten) ? rewritten.join("/") : rewritten) ||
        url.searchParams.get("route") ||
        url.pathname.replace(/^\/api\/?/, "");
      const route = "/" + routeValue.replace(/^\/+|\/+$/g, "");
      if (req.method !== "GET" && req.method !== "HEAD") {
        const origin = req.headers.origin;
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        if (origin && new URL(origin).host !== host)
          throw new ApiError(403, "Request origin is not allowed.");
      }
      if (route === "/products") {
        requireMethod(req, "GET");
        return send(200, { products: catalog, coupons });
      }
      const db = await database().catch(() => {
        throw new ApiError(
          503,
          "The store database is unavailable. Please try again shortly.",
        );
      });
      if (route === "/health") {
        requireMethod(req, "GET");
        await db.query("SELECT 1");
        return send(200, { ok: true, paymentMode: "simulation" });
      }

      const cookie = (req.headers.cookie || "")
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("growcer_session="))
        ?.slice(16);
      const sessionUser = async () => {
        if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) return null;
        const { rows } = await db.query(
          "SELECT users.id, users.email, users.name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = $1 AND sessions.expires_at > $2",
          [digest(cookie), new Date()],
        );
        return rows[0] ? safeUser(rows[0]) : null;
      };
      const setCookie = (token, maxAge) =>
        res.setHeader(
          "Set-Cookie",
          `growcer_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${process.env.VERCEL || req.headers["x-forwarded-proto"] === "https" ? "; Secure" : ""}`,
        );
      if (route === "/auth/session") {
        requireMethod(req, "GET");
        return send(200, { user: await sessionUser() });
      }
      if (route === "/auth/logout") {
        requireMethod(req, "POST");
        if (cookie)
          await db.query("DELETE FROM sessions WHERE token_hash = $1", [
            digest(cookie),
          ]);
        setCookie("", 0);
        return send(200, { ok: true });
      }
      if (route === "/auth/register" || route === "/auth/login") {
        requireMethod(req, "POST");
        const body = await readBody(req);
        const email =
          typeof body?.email === "string"
            ? body.email.trim().toLowerCase()
            : "";
        const password =
          typeof body?.password === "string" ? body.password : "";
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          email.length > 254 ||
          password.length < 8 ||
          password.length > 128
        )
          throw new ApiError(
            400,
            "Enter a valid email and a password with 8–128 characters.",
          );
        const ip = String(
          req.headers["x-forwarded-for"] ||
            req.socket?.remoteAddress ||
            "unknown",
        )
          .split(",")[0]
          .trim();
        const key = digest(ip + ":" + email);
        const reset = new Date(Date.now() + 15 * 60 * 1000);
        await db.query(
          "INSERT INTO auth_attempts (key, count, reset_at) VALUES ($1, 0, $2) ON CONFLICT (key) DO NOTHING",
          [key, reset],
        );
        await db.query(
          "UPDATE auth_attempts SET count = 0, reset_at = $2 WHERE key = $1 AND reset_at < $3",
          [key, reset, new Date()],
        );
        const attempts = await db.query(
          "UPDATE auth_attempts SET count = count + 1 WHERE key = $1 RETURNING count",
          [key],
        );
        if (attempts.rows[0].count > 15)
          throw new ApiError(
            429,
            "Too many sign-in attempts. Try again in 15 minutes.",
          );
        let user;
        if (route === "/auth/register") {
          const name = typeof body.name === "string" ? body.name.trim() : "";
          if (name.length < 2 || name.length > 100)
            throw new ApiError(400, "Enter your name (2–100 characters).");
          const salt = randomBytes(16).toString("hex");
          const hash = (await scrypt(password, salt, 64)).toString("hex");
          try {
            const result = await db.query(
              "INSERT INTO users (id, email, name, password_hash) VALUES ($1,$2,$3,$4) RETURNING id,email,name",
              [randomUUID(), email, name, `${salt}:${hash}`],
            );
            user = safeUser(result.rows[0]);
          } catch (error) {
            if (error.code === "23505")
              throw new ApiError(
                409,
                "An account with this email already exists. Please sign in.",
              );
            throw error;
          }
        } else {
          const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email],
          );
          const row = result.rows[0];
          const [salt, stored] = row
            ? row.password_hash.split(":")
            : ["invalid-user-salt", "0".repeat(128)];
          const hash = await scrypt(password, salt, 64);
          if (!timingSafeEqual(hash, Buffer.from(stored, "hex")) || !row)
            throw new ApiError(401, "Email or password is incorrect.");
          user = safeUser(row);
        }
        const token = randomBytes(32).toString("hex");
        await db.query(
          "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)",
          [digest(token), user.id, new Date(Date.now() + 7 * 86400000)],
        );
        await db.query("DELETE FROM auth_attempts WHERE key = $1", [key]);
        setCookie(token, 7 * 86400);
        return send(route === "/auth/register" ? 201 : 200, { user });
      }
      const user = await sessionUser();
      if (!user) throw new ApiError(401, "Please sign in to continue.");
      if (route === "/orders" && req.method === "GET") {
        const { rows } = await db.query(
          "SELECT payload FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
          [user.id],
        );
        return send(200, { orders: rows.map((r) => r.payload) });
      }
      if (route.startsWith("/orders/") && req.method === "GET") {
        const { rows } = await db.query(
          "SELECT payload FROM orders WHERE id = $1 AND user_id = $2",
          [route.slice(8), user.id],
        );
        if (!rows[0]) throw new ApiError(404, "Order not found.");
        return send(200, { order: rows[0].payload });
      }
      if (route === "/orders") {
        requireMethod(req, "POST");
        const body = await readBody(req);
        const requestKey = req.headers["idempotency-key"];
        if (
          typeof requestKey !== "string" ||
          !/^[\w-]{16,100}$/.test(requestKey)
        )
          throw new ApiError(400, "A valid order request key is required.");
        const previous = await db.query(
          "SELECT payload FROM orders WHERE user_id = $1 AND request_key = $2",
          [user.id, requestKey],
        );
        if (previous.rows[0])
          return send(200, { order: previous.rows[0].payload });
        let pricing, customer;
        try {
          pricing = priceCart(body?.items, body?.coupon || "");
          customer = validateDelivery(body?.customer);
        } catch (error) {
          throw new ApiError(400, error.message);
        }
        if (!["cod", "card"].includes(body.payment))
          throw new ApiError(400, "Choose a payment method.");
        if (
          body.payment === "card" &&
          !["approved", "declined"].includes(body.simulation)
        )
          throw new ApiError(400, "Choose a simulated card outcome.");
        if (body.payment === "card" && body.simulation === "declined")
          throw new ApiError(
            402,
            "Simulated payment declined. No money was charged. Try an approved simulation or cash on delivery.",
          );
        const order = {
          ...pricing,
          id: `ORD-${randomUUID()}`,
          customer,
          payment: body.payment,
          paymentStatus:
            body.payment === "cod" ? "due_on_delivery" : "simulated_paid",
          status: "confirmed",
          createdAt: new Date().toISOString(),
          simulation: true,
        };
        const saved = await db.query(
          "INSERT INTO orders (id,user_id,request_key,payload) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id,request_key) DO NOTHING RETURNING payload",
          [order.id, user.id, requestKey, JSON.stringify(order)],
        );
        if (!saved.rows[0]) {
          const existing = await db.query(
            "SELECT payload FROM orders WHERE user_id = $1 AND request_key = $2",
            [user.id, requestKey],
          );
          return send(200, { order: existing.rows[0].payload });
        }
        return send(201, { order: saved.rows[0].payload });
      }
      throw new ApiError(404, "API route not found.");
    } catch (error) {
      if (!error.status)
        console.error("Growcer API error:", error.code || error.name);
      send(error.status || 500, {
        error: error.status
          ? error.message
          : "Something went wrong. Please try again.",
      });
    }
  };
}

export default createHandler();
