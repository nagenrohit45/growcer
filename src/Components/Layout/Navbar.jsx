import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
export default function Navbar({ cart, user, onLogout, onSignIn }) {
  const [open, setOpen] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  const search = (event) => {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q").trim();
    navigate("/products/all" + (q ? "?q=" + encodeURIComponent(q) : ""));
    setOpen(false);
  };
  return (
    <header className="store-header">
      <div className="container">
        <div className="header-top">
          <Link to="/" className="brand" aria-label="Growcer home">
            Growcer<span>●</span>
          </Link>
          <span className="header-tagline">Good food. Every day.</span>
          <form
            role="search"
            onSubmit={search}
            className="search-form"
            key={params.get("q") || "empty"}
          >
            <label className="visually-hidden" htmlFor="product-search">
              Search groceries
            </label>
            <input
              id="product-search"
              name="q"
              type="search"
              placeholder="Search rice, milk, vegetables…"
              defaultValue={params.get("q") || ""}
              maxLength="100"
            />
            <button type="submit" aria-label="Search groceries">
              Search
            </button>
          </form>
          <Link
            to="/cart"
            className="cart-link"
            aria-label={"Cart, " + total + " items"}
          >
            Cart <span>{total}</span>
          </Link>
          <button
            className="menu-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="store-navigation"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
        <nav
          id="store-navigation"
          className={"store-navigation " + (open ? "is-open" : "")}
          aria-label="Main navigation"
        >
          <div className="nav-categories">
            {[
              ["all", "Shop all"],
              ["vegetables", "Vegetables"],
              ["fruits", "Fruits"],
              ["dairy", "Dairy & Bakery"],
              ["essentials", "Rice & Pulses"],
            ].map(([id, label]) => (
              <NavLink
                key={id}
                to={"/products/" + id}
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <NavLink to="/offers" onClick={() => setOpen(false)}>
              Offers
            </NavLink>
          </div>
          <div className="account-navigation">
            {user ? (
              <>
                <NavLink to="/orders" onClick={() => setOpen(false)}>
                  My orders
                </NavLink>
                <button onClick={onLogout} className="link-button">
                  Sign out
                </button>
              </>
            ) : (
              <button className="link-button" onClick={onSignIn}>
                Sign in / Register
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
