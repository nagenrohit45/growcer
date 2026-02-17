import tomatoesImg from "../../assets/images/products/tomatoes.png";
import applesImg from "../../assets/images/products/apples.png";
import milkImg from "../../assets/images/products/milk.png";
import riceImg from "../../assets/images/products/rice.png";

const FeaturedProducts = ({ addToCart }) => {
  return (
    <section className="featured-products py-5 bg-light">
      <div className="container">
        {/* Heading */}
        <div className="text-center mb-5">
          <h2 className="fw-bold">Featured Products</h2>
          <p className="text-muted mt-2">Popular items customers buy daily</p>
        </div>

        <div className="row g-4">
          {/* Fresh Tomatoes */}
          <div className="col-md-3">
            <div className="card h-100 shadow-sm border-0">
              <img
                src={tomatoesImg}
                alt="Fresh Tomatoes"
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h6 className="fw-semibold">Fresh Tomatoes</h6>
                <p className="text-muted small mb-2">1 Kg</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-success">₹40</span>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() =>
                      addToCart({
                        id: 100,
                        name: "Fresh Tomatoes",
                        price: 40,
                        quantity: 1,
                      })
                    }
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Apples */}
          <div className="col-md-3">
            <div className="card h-100 shadow-sm border-0">
              <img
                src={applesImg}
                alt="Apples"
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h6 className="fw-semibold">Apples</h6>
                <p className="text-muted small mb-2">1 Kg</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-success">₹120</span>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() =>
                      addToCart({
                        id: 101,
                        name: "Apples",
                        price: 120,
                        quantity: 1,
                      })
                    }
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Milk */}
          <div className="col-md-3">
            <div className="card h-100 shadow-sm border-0">
              <img
                src={milkImg}
                alt="Milk"
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h6 className="fw-semibold">Milk</h6>
                <p className="text-muted small mb-2">500 ml</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-success">₹30</span>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() =>
                      addToCart({
                        id: 102,
                        name: "Milk",
                        price: 30,
                        quantity: 1,
                      })
                    }
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rice */}
          <div className="col-md-3">
            <div className="card h-100 shadow-sm border-0">
              <img
                src={riceImg}
                alt="Rice"
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h6 className="fw-semibold">Rice</h6>
                <p className="text-muted small mb-2">5 Kg</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-success">₹350</span>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() =>
                      addToCart({
                        id: 103,
                        name: "Rice",
                        price: 350,
                        quantity: 1,
                      })
                    }
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
