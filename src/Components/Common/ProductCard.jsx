import { money } from "../../lib/client";
export default function ProductCard({ product, addToCart }) {
  return (
    <article className="card product-card h-100 border-0">
      <div className="product-image">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width="320"
          height="220"
        />
      </div>
      <div className="card-body d-flex flex-column">
        <p className="eyebrow mb-2">{product.category}</p>
        <h3 className="h5">{product.name}</h3>
        <p className="text-muted small">{product.unit}</p>
        <div className="d-flex justify-content-between align-items-center mt-auto gap-2">
          <strong className="product-price">{money(product.price)}</strong>
          <button
            className="btn btn-success"
            onClick={() => addToCart(product)}
            aria-label={
              "Add " + product.name + " (" + product.unit + ") to cart"
            }
          >
            + Add
          </button>
        </div>
      </div>
    </article>
  );
}
