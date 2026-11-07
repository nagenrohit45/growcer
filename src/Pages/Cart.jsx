import { Link } from "react-router-dom";
import { coupons, priceCart } from "../../shared/catalog";
import { money } from "../lib/client";
export default function Cart({ cart, setCart, coupon, setCoupon }) {
  if (!cart.length)
    return (
      <section className="container section-space">
        <div className="empty-state">
          <p className="eyebrow">Your basket</p>
          <h1>Your cart is empty</h1>
          <p>Fresh finds are just a few clicks away.</p>
          <Link className="btn btn-success" to="/products/all">
            Start shopping
          </Link>
        </div>
      </section>
    );
  const pricing = priceCart(
    cart,
    coupons.some((c) => c.code === coupon) ? coupon : "",
  );
  const quantity = (id, delta) =>
    setCart((current) =>
      current
        .map((p) =>
          p.id === id
            ? { ...p, quantity: Math.min(99, p.quantity + delta) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  return (
    <section className="container section-space">
      <p className="eyebrow">Ready when you are</p>
      <h1>Your cart</h1>
      <p className="text-muted">A little freshness for your everyday.</p>
      <div className="row g-4 mt-1">
        <div className="col-lg-8">
          {cart.map((item) => (
            <article key={item.id} className="basket-item">
              <img src={item.image} alt={item.name} width="88" height="88" />
              <div className="basket-description">
                <h2 className="h5">{item.name}</h2>
                <p className="text-muted small mb-1">
                  {item.unit} · {money(item.price)} each
                </p>
                <button
                  className="link-button text-danger small"
                  aria-label={"Remove " + item.name}
                  onClick={() =>
                    setCart((current) =>
                      current.filter((p) => p.id !== item.id),
                    )
                  }
                >
                  Remove
                </button>
              </div>
              <div className="quantity-control">
                <button
                  aria-label={"Decrease " + item.name + " quantity"}
                  onClick={() => quantity(item.id, -1)}
                >
                  −
                </button>
                <span aria-label={item.name + " quantity"}>
                  {item.quantity}
                </span>
                <button
                  aria-label={"Increase " + item.name + " quantity"}
                  disabled={item.quantity >= 99}
                  onClick={() => quantity(item.id, 1)}
                >
                  +
                </button>
              </div>
              <strong>{money(item.price * item.quantity)}</strong>
            </article>
          ))}
          <Link className="text-success d-inline-block mt-3" to="/products/all">
            ← Continue shopping
          </Link>
        </div>
        <div className="col-lg-4">
          <div className="summary-card">
            <h2 className="h4">Basket summary</h2>
            <label htmlFor="coupon" className="form-label mt-3">
              Select coupon
            </label>
            <select
              id="coupon"
              className="form-select mb-4"
              value={pricing.coupon}
              onChange={(event) => setCoupon(event.target.value)}
            >
              <option value="">No coupon</option>
              {coupons.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{money(pricing.subtotal)}</span>
            </div>
            <div className="summary-line text-success">
              <span>Discount</span>
              <span>−{money(pricing.discount)}</span>
            </div>
            <div className="summary-line">
              <span>Delivery</span>
              <span>Demo · no fee</span>
            </div>
            <hr />
            <div className="summary-line fw-bold fs-5">
              <span>Total</span>
              <span data-testid="cart-total">{money(pricing.total)}</span>
            </div>
            <Link to="/checkout" className="btn btn-success w-100 mt-4">
              Proceed to checkout →
            </Link>
            <p className="small text-muted mb-0 mt-3">
              Payments are simulated. No money will be charged.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
