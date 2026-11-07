import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./Components/Layout/Navbar";
import Home from "./Pages/Home";
import Categories from "./Components/Categories/Categories";
import Footer from "./Components/Layout/Footer";
import Products from "./Pages/Products";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import OrderSuccess from "./Pages/OrderSuccess";
import Orders from "./Pages/Orders";
import Information from "./Pages/Information";
import LoginModal from "./Components/Auth/LoginModal";
import { api, readStorage, saveStorage, money } from "./lib/client";
import { products } from "./Data/products";

function initialCart() {
  const saved = readStorage("cart", []);
  if (!Array.isArray(saved)) return [];
  const merged = new Map();
  for (const line of saved) {
    const id = { 100: 1, 101: 6 }[line?.id] || Number(line?.id);
    const product = products.find((p) => p.id === id);
    if (product && Number.isInteger(line.quantity) && line.quantity > 0)
      merged.set(id, {
        ...product,
        quantity: Math.min(99, (merged.get(id)?.quantity || 0) + line.quantity),
      });
  }
  return [...merged.values()];
}

export default function App() {
  const [cart, setCart] = useState(initialCart);
  const [coupon, setCoupon] = useState(() => readStorage("growcer-coupon", ""));
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [notice, setNotice] = useState("");
  const location = useLocation();
  useEffect(() => {
    let active = true;
    api("/auth/session")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((error) => {
        if (active) setSessionError(error.message);
      })
      .finally(() => {
        if (active) setSessionLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    saveStorage(
      "cart",
      cart.map(({ id, quantity }) => ({ id, quantity })),
    );
  }, [cart]);
  useEffect(() => {
    saveStorage("growcer-coupon", coupon);
  }, [coupon]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const addToCart = (product) => {
    setCart((current) =>
      current.some((p) => p.id === product.id)
        ? current.map((p) =>
            p.id === product.id
              ? { ...p, quantity: Math.min(99, p.quantity + 1) }
              : p,
          )
        : [...current, { ...product, quantity: 1 }],
    );
    setNotice(product.name + " added to your cart · " + money(product.price));
  };
  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setNotice("You have signed out.");
    } catch (error) {
      setNotice(error.message);
    }
  };
  const authProps = { user, sessionLoading, onSignIn: () => setAuthOpen(true) };
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="store-notice">
        Demo store · Payments are simulated. No real charges or deliveries.
      </div>
      <Navbar
        cart={cart}
        user={user}
        onLogout={logout}
        onSignIn={() => setAuthOpen(true)}
      />
      {sessionError && (
        <div className="container mt-3">
          <div className="alert alert-warning" role="alert">
            Account service: {sessionError}{" "}
            <button
              className="btn btn-sm btn-outline-dark ms-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <main id="main-content" tabIndex="-1">
        <Routes>
          <Route path="/" element={<Home addToCart={addToCart} />} />
          <Route path="/categories" element={<Categories />} />
          <Route
            path="/products/:category"
            element={<Products addToCart={addToCart} />}
          />
          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                setCart={setCart}
                coupon={coupon}
                setCoupon={setCoupon}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <Checkout
                cart={cart}
                setCart={setCart}
                coupon={coupon}
                setCoupon={setCoupon}
                {...authProps}
              />
            }
          />
          <Route
            path="/order-success/:orderId"
            element={
              <OrderSuccess
                key={(user?.id || "") + location.pathname}
                {...authProps}
              />
            }
          />
          <Route
            path="/order-success"
            element={<Information page="missing-order" />}
          />
          <Route
            path="/orders"
            element={<Orders key={user?.id || "anonymous"} {...authProps} />}
          />
          {["offers", "about", "contact", "privacy", "terms"].map((page) => (
            <Route
              key={page}
              path={"/" + page}
              element={<Information page={page} />}
            />
          ))}
          <Route path="*" element={<Information page="not-found" />} />
        </Routes>
      </main>
      <Footer />
      <div
        role="status"
        aria-live="polite"
        className={"cart-toast " + (notice ? "visible" : "")}
      >
        {notice}
      </div>
      {authOpen && (
        <LoginModal
          onClose={() => setAuthOpen(false)}
          onLogin={(account) => {
            setUser(account);
            setSessionError("");
            setAuthOpen(false);
          }}
        />
      )}
    </>
  );
}
