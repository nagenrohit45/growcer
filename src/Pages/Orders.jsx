import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../lib/client";
export default function Orders({ user, sessionLoading, onSignIn }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!user) return;
    let active = true;
    api("/orders")
      .then((data) => {
        if (active) {
          setOrders(data.orders);
          setError("");
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [user, version]);
  return (
    <section className="container section-space">
      <p className="eyebrow">Your account</p>
      <h1>My orders</h1>
      {sessionLoading ? (
        <p role="status">Checking your account…</p>
      ) : !user ? (
        <div className="empty-state">
          <p>Sign in to view your saved orders.</p>
          <button className="btn btn-success" onClick={onSignIn}>
            Sign in / Register
          </button>
        </div>
      ) : error ? (
        <div role="alert" className="alert alert-danger">
          {error}{" "}
          <button
            className="btn btn-outline-dark btn-sm"
            onClick={() => setVersion((v) => v + 1)}
          >
            Retry
          </button>
        </div>
      ) : !orders ? (
        <p role="status">Loading orders…</p>
      ) : !orders.length ? (
        <div className="empty-state">
          <h2 className="h4">Your first basket is waiting</h2>
          <p>Your orders will appear here after checkout.</p>
          <Link className="btn btn-success" to="/products/all">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <article key={order.id} className="summary-card mb-3">
              <div className="section-heading mb-2">
                <div>
                  <h2 className="h6 order-id">{order.id}</h2>
                  <p className="small text-muted mb-0">
                    {new Date(order.createdAt).toLocaleString()} ·{" "}
                    {order.items.length} products
                  </p>
                </div>
                <strong>{money(order.total)}</strong>
              </div>
              <p className="small">
                Confirmed ·{" "}
                {order.payment === "cod"
                  ? "Due on delivery (demo)"
                  : "Simulated card payment"}
              </p>
              <Link
                className="text-success fw-semibold"
                to={"/order-success/" + order.id}
              >
                View order →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
