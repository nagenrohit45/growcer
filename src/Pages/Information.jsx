import { Link } from "react-router-dom";
import { coupons } from "../../shared/catalog";
const pages = {
  about: {
    title: "Good food. Every day.",
    body: "Growcer brings vegetables, fruits, dairy and pantry essentials together in one easy-to-use market. Browse by category, build your basket and keep track of orders in your account.",
  },
  contact: {
    title: "Contact & support",
    body: "Have a question about Growcer? Email us using the address below. For an order question, include the order number from My orders. Payments and deliveries on this website are demonstrations only.",
  },
  privacy: {
    title: "Privacy policy",
    body: "This demonstration stores your account name, email, hashed password, session records and order delivery details in the store database. Your cart and coupon are saved in your browser. Session cookies keep you signed in. Card payments are simulated and no card numbers are collected. Use sample delivery details for demo orders. Sign out on shared devices; clearing browser storage removes the local cart but does not delete your saved account or orders.",
  },
  terms: {
    title: "Terms & conditions",
    body: "Growcer is a demonstration shopping application. Product prices are shown in Indian rupees. Orders and payment outcomes are saved for demonstration only: no sale, payment charge, shipment or delivery takes place. Discounts cannot exceed the eligible basket value. This site must be given real business policies and verified product information before being used for actual commerce.",
  },
  "missing-order": {
    title: "Find your saved order",
    body: "Open My orders to view your order history and receipts.",
  },
  "not-found": {
    title: "This page is not in our basket",
    body: "The address may have changed. Explore the market or return to the homepage.",
  },
};
export default function Information({ page }) {
  if (page === "offers")
    return (
      <section className="container section-space">
        <p className="eyebrow">A little extra value</p>
        <h1>Offers for your basket</h1>
        <p className="text-muted">
          Select a coupon in your cart. One offer per order; discounts are
          capped at the basket value.
        </p>
        <div className="row g-4 mt-2">
          {coupons.map((c) => (
            <div key={c.code} className="col-md-6">
              <article className="summary-card h-100">
                <p className="coupon-code">{c.code}</p>
                <h2 className="h4">{c.label}</h2>
                <p className="text-muted">
                  Applied consistently from your cart through to your saved
                  receipt.
                </p>
                <Link
                  className="btn btn-outline-success"
                  to={
                    c.code === "VEG20"
                      ? "/products/vegetables"
                      : "/products/all"
                  }
                >
                  Shop this offer →
                </Link>
              </article>
            </div>
          ))}
        </div>
      </section>
    );
  const data = pages[page] || pages["not-found"];
  return (
    <section className="container section-space">
      <div className="information-page">
        <p className="eyebrow">Growcer</p>
        <h1>{data.title}</h1>
        <p className="lead mt-4">{data.body}</p>
        {page === "contact" && (
          <div className="contact-email-card">
            <h2 className="h5">Email us</h2>
            <a href="mailto:yellanurunagendra45@gmail.com">
              yellanurunagendra45@gmail.com
            </a>
            <p className="small text-muted mt-2 mb-0">
              Click the email address to open your email app.
            </p>
          </div>
        )}
        <div className="d-flex gap-3 mt-4 flex-wrap">
          <Link
            className="btn btn-success"
            to={
              page === "contact" || page === "missing-order"
                ? "/orders"
                : "/products/all"
            }
          >
            {page === "contact" || page === "missing-order"
              ? "View my orders"
              : "Explore groceries"}
          </Link>
          <Link className="btn btn-outline-success" to="/">
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
