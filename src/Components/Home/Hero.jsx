import { Link } from "react-router-dom";
import hero from "../../assets/images/hero.webp";
export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">Fresh finds. Simple shopping.</p>
          <h1>
            A fresher way to fill <span>your everyday basket.</span>
          </h1>
          <p>
            From colourful vegetables to pantry favourites, find the groceries
            that make every day taste better.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-success" to="/products/all">
              Shop now →
            </Link>
            <Link className="btn btn-outline-success" to="/categories">
              Explore categories
            </Link>
          </div>
          <p className="hero-caption">
            Vegetables · Fruits · Dairy · Daily essentials
          </p>
        </div>
        <img
          className="hero-image"
          src={hero}
          alt="A selection of fresh groceries"
          width="600"
          height="410"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}
