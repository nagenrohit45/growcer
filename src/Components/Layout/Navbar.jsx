import styles from "../../Styles/Navbar.module.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Navbar = ({ cart, onLogout, setSearchQuery }) => {
  const navigate = useNavigate();
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    onLogout();
  };

  return (
    <header className={styles.headerWrapper}>
      <nav className="navbar navbar-expand-lg">
        <div className="container">
          {/* LOGO */}
          <a className="navbar-brand  fw-bold" href="/">
            Growcer
          </a>

          {/* TOGGLER (MOBILE) */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* ALL NAV CONTENT */}
          <div className="collapse navbar-collapse" id="mainNavbar">
            {/* LEFT : CATEGORIES */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-3">
              <li className="nav-item">
                <Link
                  className="nav-link fw-semibold"
                  to="/products/vegetables"
                >
                  Vegetables
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link fw-semibold" to="/products/fruits">
                  Fruits
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link fw-semibold" to="/products/dairy">
                  Dairy & Bakery
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className="nav-link fw-semibold"
                  to="/products/essentials"
                >
                  Rice & Pulses
                </Link>
              </li>
            </ul>

            {/* RIGHT : SEARCH + LOGIN + CART */}
            <div className="d-flex align-items-center gap-3">
              {/* SEARCH */}
              <input
                type="text"
                className="form-control d-none d-lg-block"
                placeholder="Search rice, milk, vegetables..."
                style={{ width: "420px" }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  navigate("/products/all");
                }}
              />

              {/* LOGOUT */}
              <button className="btn btn-danger ms-3" onClick={handleLogout}>
                Logout
              </button>

              {/* CART */}
              <Link
                to="/cart"
                className="btn btn-outline-success position-relative"
              >
                Cart
                {totalItems > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
