import { useNavigate } from "react-router-dom";

import vegImg from "../../assets/images/vegetables.png";
import fruitImg from "../../assets/images/fruits.png";
import dairyImg from "../../assets/images/dairy.png";
import essentialsImg from "../../assets/images/daily essentials.png";

const CategorySection = () => {
  const navigate = useNavigate();

  return (
    <section className="category-section py-5 bg-light">
      <div className="container">
        {/* Section Heading */}
        <div className="text-center mb-5">
          <h2 className="fw-bold">Shop by Category</h2>
          <p className="text-muted mt-2">
            Fresh products handpicked for your daily needs
          </p>
        </div>

        {/* Categories */}
        <div className="row g-4">
          {/* Vegetables */}
          <div className="col-md-3">
            <div
              className="card h-100 shadow-sm border-0 text-center"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/products/vegetables")}>
              <img
                src={vegImg}
                alt="Vegetables"
                className="card-img-top"
                style={{ height: "220px", objectFit: "cover" }}/>
              <div className="card-body">
                <h5 className="fw-semibold">Vegetables</h5>
                <p className="text-muted small mb-0">Farm-fresh & organic</p>
              </div>
            </div>
          </div>

          {/* Fruits */}
          <div className="col-md-3">
            <div
              className="card h-100 shadow-sm border-0 text-center"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/products/fruits")}>
              <img
                src={fruitImg}
                alt="Fruits"
                className="card-img-top"
                style={{ height: "220px", objectFit: "cover" }}/>
              <div className="card-body">
                <h5 className="fw-semibold">Fruits</h5>
                <p className="text-muted small mb-0">Fresh & seasonal</p>
              </div>
            </div>
          </div>

          {/* Dairy */}
          <div className="col-md-3">
            <div
              className="card h-100 shadow-sm border-0 text-center"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/products/dairy")}>
              <img
                src={dairyImg}
                alt="Dairy"
                className="card-img-top"
                style={{ height: "220px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="fw-semibold">Dairy</h5>
                <p className="text-muted small mb-0">Milk, cheese & more</p>
              </div>
            </div>
          </div>

          {/* Daily Essentials */}
          <div className="col-md-3">
            <div
              className="card h-100 shadow-sm border-0 text-center"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/products/essentials")}>
              <img
                src={essentialsImg}
                alt="Daily Essentials"
                className="card-img-top"
                style={{ height: "220px", objectFit: "cover" }}/>
              <div className="card-body">
                <h5 className="fw-semibold">Daily Essentials</h5>
                <p className="text-muted small mb-0">Rice, oil & groceries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
