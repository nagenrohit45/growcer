import { Link } from "react-router-dom";
export default function OfferBanner() {
  return (
    <section className="bg-success text-white py-5">
      <div className="container section-heading mb-0">
        <div>
          <p className="eyebrow text-white">
            A little greener, a little better
          </p>
          <h2>20% off your vegetable picks</h2>
          <p className="mb-0">
            Choose VEG20 in your cart. Discount applies to vegetables only.
          </p>
        </div>
        <Link className="btn btn-light flex-shrink-0" to="/products/vegetables">
          Shop vegetables →
        </Link>
      </div>
    </section>
  );
}
