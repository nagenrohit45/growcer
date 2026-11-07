import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../lib/client";
export default function OrderSuccess({ user, sessionLoading, onSignIn }) {
  const { orderId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    let active = true;
    api("/orders/" + encodeURIComponent(orderId))
      .then((data) => {
        if (active) setResult(data.order);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [user, orderId]);
  if (sessionLoading)
    return (
      <p className="container section-space" role="status">
        Checking your account…
      </p>
    );
  if (!user)
    return (
      <section className="container section-space empty-state">
        <h1>Your order details</h1>
        <p>Please sign in to view this order.</p>
        <button onClick={onSignIn} className="btn btn-success">
          Sign in
        </button>
      </section>
    );
  if (error)
    return (
      <section className="container section-space">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to="/orders">View my orders</Link>
      </section>
    );
  if (!result)
    return (
      <p className="container section-space" role="status">
        Loading your order…
      </p>
    );
  return (
    <section className="container section-space">
      <div className="order-receipt summary-card mx-auto">
        <div className="success-icon" aria-hidden="true">
          ✓
        </div>
        <p className="eyebrow text-center">Saved to your account</p>
        <h1 className="h2 text-center">Order confirmed</h1>
        <p className="text-center text-muted">
          Thanks, {result.customer.name}. Your demo order is ready to view.
        </p>
        <p className="order-id small text-center">{result.id}</p>
        <hr />
        <h2 className="h5">Delivery details</h2>
        <p>
          {result.customer.name}
          <br />
          {result.customer.address}, {result.customer.city}
          <br />
          {result.customer.phone}
        </p>
        <p className="payment-simulation">
          {result.payment === "cod"
            ? "Cash on delivery · payment due (demo)"
            : "Card payment simulated · no money charged"}
        </p>
        <h2 className="h5 mt-4">Order summary</h2>
        {result.items.map((item) => (
          <div className="summary-line" key={item.id}>
            <span>
              {item.name} ({item.unit}) × {item.quantity}
            </span>
            <span>{money(item.lineTotal)}</span>
          </div>
        ))}
        <hr />
        <div className="summary-line">
          <span>Subtotal</span>
          <span>{money(result.subtotal)}</span>
        </div>
        <div className="summary-line text-success">
          <span>Discount {result.coupon}</span>
          <span>−{money(result.discount)}</span>
        </div>
        <div className="summary-line fw-bold fs-5">
          <span>
            {result.payment === "cod" ? "Amount due (demo)" : "Simulated total"}
          </span>
          <span>{money(result.total)}</span>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-4 no-print">
          <Link className="btn btn-success flex-grow-1" to="/products/all">
            Continue shopping
          </Link>
          <Link className="btn btn-outline-success" to="/orders">
            My orders
          </Link>
          <button
            className="btn btn-outline-secondary"
            onClick={() => window.print()}
          >
            Print receipt
          </button>
        </div>
      </div>
    </section>
  );
}
