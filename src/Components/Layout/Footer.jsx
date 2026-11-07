import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-5">
            <Link className="brand" to="/">
              Growcer<span>●</span>
            </Link>
            <p className="mt-3 footer-intro">
              Fresh picks for your everyday basket. Explore groceries, discover
              offers, and make your next meal a little easier.
            </p>
            <small>
              Demo shopping experience · No real payments or deliveries.
            </small>
          </div>
          <div className="col-6 col-md-3">
            <h2 className="h6">Explore</h2>
            <ul>
              {[
                ["/", "Home"],
                ["/products/all", "Shop"],
                ["/categories", "Categories"],
                ["/offers", "Offers"],
              ].map(([to, text]) => (
                <li key={to}>
                  <Link to={to}>{text}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-6 col-md-4">
            <h2 className="h6">Customer care</h2>
            <ul>
              {[
                ["/about", "About Us"],
                ["/contact", "Contact"],
                ["/privacy", "Privacy Policy"],
                ["/terms", "Terms & Conditions"],
              ].map(([to, text]) => (
                <li key={to}>
                  <Link to={to}>{text}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Growcer. Built for everyday essentials.
        </div>
      </div>
    </footer>
  );
}
