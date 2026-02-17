const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-5">
      <div className="container">

        <div className="row">

          {/* BRAND INFO */}
          <div className="col-md-4 mb-4">
            <h4 className="fw-bold text-success">Growcer</h4>
            <p className="text-secondary">
              Fresh groceries delivered fast to your doorstep.
              Quality products, trusted service, every day.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div className="col-md-2 mb-4">
            <h6 className="fw-bold">Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-secondary text-decoration-none">Home</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Shop</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Categories</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Offers</a></li>
            </ul>
          </div>

          {/* CUSTOMER SERVICE */}
          <div className="col-md-3 mb-4">
            <h6 className="fw-bold">Customer Service</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-secondary text-decoration-none">About Us</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Contact</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Privacy Policy</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* CONTACT */}
          <div className="col-md-3 mb-4">
            <h6 className="fw-bold">Contact Us</h6>
            <p className="text-secondary mb-1">📍 Hyderabad, India</p>
            <p className="text-secondary mb-1">📞 +91 98765 43210</p>
            <p className="text-secondary">✉️ support@growcer.com</p>
          </div>

        </div>

        <hr className="border-secondary" />

        {/* BOTTOM BAR */}
        <div className="text-center pb-3">
          <p className="mb-0 text-secondary">
            © {new Date().getFullYear()} Growcer. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
