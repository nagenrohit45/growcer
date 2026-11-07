import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { coupons, priceCart, validateDelivery } from "../../shared/catalog";
import { api, money } from "../lib/client";
export default function Checkout({
  cart,
  setCart,
  coupon,
  setCoupon,
  user,
  sessionLoading,
  onSignIn,
}) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState("cod");
  const request = useRef(null);
  if (!cart.length)
    return (
      <section className="container section-space empty-state">
        <h1>Your cart is empty</h1>
        <Link to="/products/all" className="btn btn-success mt-3">
          Browse groceries
        </Link>
      </section>
    );
  if (sessionLoading)
    return (
      <p role="status" className="container section-space">
        Checking your account…
      </p>
    );
  if (!user)
    return (
      <section className="container section-space empty-state">
        <h1>Sign in to checkout</h1>
        <p>
          Your basket is saved. Sign in or create an account to save your order.
        </p>
        <button className="btn btn-success" onClick={onSignIn}>
          Sign in / Register
        </button>
      </section>
    );
  const pricing = priceCart(
    cart,
    coupons.some((c) => c.code === coupon) ? coupon : "",
  );
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    let customer;
    try {
      customer = validateDelivery(values);
    } catch (failure) {
      setError(failure.message);
      return;
    }
    const body = {
      items: cart.map(({ id, quantity }) => ({ id, quantity })),
      coupon: pricing.coupon,
      customer,
      payment: values.payment,
      simulation: values.simulation,
    };
    const fingerprint = JSON.stringify(body);
    if (!request.current || request.current.fingerprint !== fingerprint)
      request.current = { fingerprint, key: crypto.randomUUID() };
    setBusy(true);
    try {
      const { order } = await api("/orders", {
        method: "POST",
        headers: { "Idempotency-Key": request.current.key },
        body,
      });
      setCart([]);
      setCoupon("");
      navigate("/order-success/" + order.id);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="container section-space">
      <p className="eyebrow">One last step</p>
      <h1>Checkout</h1>
      <p className="text-muted">Demo order · use sample delivery details.</p>
      <form onSubmit={submit}>
        <div className="row g-4 mt-1">
          <div className="col-lg-7">
            <div className="summary-card">
              <h2 className="h4 mb-4">Delivery details</h2>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="row g-3">
                {[
                  ["name", "Full name", "text", "name", 2, 100],
                  ["phone", "Phone number", "tel", "tel", 10, 20],
                  ["city", "City", "text", "address-level2", 2, 100],
                ].map(([name, label, type, autoComplete, min, max]) => (
                  <div
                    className={name === "name" ? "col-12" : "col-md-6"}
                    key={name}
                  >
                    <label className="form-label" htmlFor={"delivery-" + name}>
                      {label}
                    </label>
                    <input
                      className="form-control"
                      id={"delivery-" + name}
                      name={name}
                      type={type}
                      autoComplete={autoComplete}
                      required
                      minLength={min}
                      maxLength={max}
                      defaultValue={name === "name" ? user.name : ""}
                    />
                  </div>
                ))}
                <div className="col-12">
                  <label htmlFor="delivery-address" className="form-label">
                    Delivery address
                  </label>
                  <textarea
                    className="form-control"
                    id="delivery-address"
                    name="address"
                    autoComplete="street-address"
                    required
                    minLength="8"
                    maxLength="300"
                    rows="3"
                  />
                </div>
              </div>
              <h2 className="h4 mt-4">Payment method</h2>
              <label htmlFor="payment" className="form-label">
                Choose payment
              </label>
              <select
                id="payment"
                name="payment"
                className="form-select"
                value={payment}
                onChange={(event) => setPayment(event.target.value)}
              >
                <option value="cod">Cash on delivery (demo)</option>
                <option value="card">Credit / debit card (simulation)</option>
              </select>
              {payment === "card" && (
                <div className="payment-simulation mt-3">
                  <strong>Card simulation — no real charge</strong>
                  <p className="small mt-2">
                    Do not enter real card details. Choose an outcome to test
                    checkout.
                  </p>
                  <label htmlFor="simulation" className="form-label">
                    Simulated payment outcome
                  </label>
                  <select
                    id="simulation"
                    name="simulation"
                    className="form-select"
                  >
                    <option value="approved">
                      Approved — complete demo order
                    </option>
                    <option value="declined">
                      Declined — test payment failure
                    </option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-5">
            <div className="summary-card">
              <h2 className="h4 mb-4">Order summary</h2>
              {pricing.items.map((item) => (
                <div key={item.id} className="summary-line">
                  <span>
                    {item.name} ({item.unit}) × {item.quantity}
                  </span>
                  <span>{money(item.lineTotal)}</span>
                </div>
              ))}
              <hr />
              <div className="summary-line">
                <span>Subtotal</span>
                <span>{money(pricing.subtotal)}</span>
              </div>
              <div className="summary-line text-success">
                <span>Discount {pricing.coupon}</span>
                <span>−{money(pricing.discount)}</span>
              </div>
              <div className="summary-line fw-bold fs-5 mt-3">
                <span>Total</span>
                <span data-testid="checkout-total">{money(pricing.total)}</span>
              </div>
              <button className="btn btn-success w-100 mt-4" disabled={busy}>
                {busy ? "Saving your order…" : "Place demo order"}
              </button>
              <p className="small text-muted mt-3 mb-0">
                Your order is saved to your account. No actual payment or
                delivery will take place.
              </p>
            </div>
            <Link className="d-inline-block mt-3 text-success" to="/cart">
              ← Back to cart
            </Link>
          </div>
        </div>
      </form>
    </section>
  );
}
