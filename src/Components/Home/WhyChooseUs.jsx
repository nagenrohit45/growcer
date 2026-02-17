import {
  FaTruck,
  FaLeaf,
  FaRupeeSign,
  FaHeadset
} from "react-icons/fa";

const WhyChooseUs = () => {
  return (
    <section className="py-5 bg-light">
      <div className="container">

        {/* Section Heading */}
        <div className="text-center mb-5">
          <h2 className="fw-bold">Why Choose Us</h2>
          <p className="text-muted">
            Fresh groceries, fast delivery, trusted service
          </p>
        </div>

        <div className="row g-4">

          {/* Fast Delivery */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-white p-4 rounded shadow-sm text-center h-100">
              <FaTruck size={40} className="text-success mb-3" />
              <h5 className="fw-bold">Fast Delivery</h5>
              <p className="text-muted mb-0">
                Same-day delivery at your doorstep
              </p>
            </div>
          </div>

          {/* Fresh Products */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-white p-4 rounded shadow-sm text-center h-100">
              <FaLeaf size={40} className="text-success mb-3" />
              <h5 className="fw-bold">Fresh Products</h5>
              <p className="text-muted mb-0">
                Directly sourced from local farms
              </p>
            </div>
          </div>

          {/* Best Prices */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-white p-4 rounded shadow-sm text-center h-100">
              <FaRupeeSign size={40} className="text-success mb-3" />
              <h5 className="fw-bold">Best Prices</h5>
              <p className="text-muted mb-0">
                Affordable prices every day
              </p>
            </div>
          </div>

          {/* Support */}
          <div className="col-md-3 col-sm-6">
            <div className="bg-white p-4 rounded shadow-sm text-center h-100">
              <FaHeadset size={40} className="text-success mb-3" />
              <h5 className="fw-bold">24/7 Support</h5>
              <p className="text-muted mb-0">
                Always here to help you
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
