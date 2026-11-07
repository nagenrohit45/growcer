import { Link } from "react-router-dom";
import vegetables from "../../assets/images/categories/vegetables.webp";
import fruits from "../../assets/images/categories/fruits.webp";
import dairy from "../../assets/images/categories/dairy.webp";
import essentials from "../../assets/images/categories/essentials.webp";
const categories = [
  ["vegetables", "Vegetables", "Farm-fresh favourites", vegetables],
  ["fruits", "Fruits", "Colourful everyday picks", fruits],
  ["dairy", "Dairy", "Milk, cheese & more", dairy],
  ["essentials", "Daily essentials", "Your pantry, sorted", essentials],
];
export default function CategorySection() {
  return (
    <section className="section-space category-section">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your favourites</p>
            <h2>Shop by category</h2>
            <p className="text-muted mb-0">A fresh start for every meal.</p>
          </div>
          <Link className="text-success fw-semibold" to="/products/all">
            View all groceries →
          </Link>
        </div>
        <div className="row g-3 g-lg-4">
          {categories.map(([id, name, description, image]) => (
            <div className="col-6 col-lg-3" key={id}>
              <Link className="category-card" to={"/products/" + id}>
                <img
                  src={image}
                  alt={name}
                  loading="lazy"
                  width="300"
                  height="160"
                />
                <div className="category-card-body">
                  <h3>
                    {name} <span aria-hidden="true">↗</span>
                  </h3>
                  <p>{description}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
