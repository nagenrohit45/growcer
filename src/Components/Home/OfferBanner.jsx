import { useNavigate } from "react-router-dom";


const OfferBanner = () => {

  const navigate = useNavigate();

  return (
    <section className="bg-success text-white py-4 my-5">
      <div className="container">
        <div className="row align-items-center">

          {/* LEFT CONTENT */}
          <div className="col-md-8 text-center text-md-start">
            <h3 className="fw-bold mb-2">
              Flat 20% OFF on Fresh Vegetables
            </h3>
            <p className="mb-0">
              Order today & get farm-fresh items delivered to your door
            </p>
          </div>

          {/* RIGHT BUTTON */}
          <div className="col-md-4 text-center text-md-end mt-3 mt-md-0">
            <button className="btn btn-light fw-bold px-4 py-2"
            onClick={() => navigate("/categories")}>
              Shop Now
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default OfferBanner;
