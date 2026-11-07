import { Link } from "react-router-dom";
import { featured } from "../../Data/products";
import ProductCard from "../Common/ProductCard";
export default function FeaturedProducts({ addToCart }) {
  return (
    <section className="section-space">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Basket favourites</p>
            <h2>Fresh picks for your week</h2>
            <p className="text-muted">
              Your everyday essentials, all in one place.
            </p>
          </div>
          <Link className="text-success fw-semibold" to="/products/all">
            Shop all products →
          </Link>
        </div>
        <div className="row g-3 g-lg-4">
          {featured.map((product) => (
            <div className="col-6 col-lg-3" key={product.id}>
              <ProductCard product={product} addToCart={addToCart} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
