import { Link, useParams, useSearchParams } from "react-router-dom";
import { products } from "../Data/products";
import ProductCard from "../Components/Common/ProductCard";
import { getSearchSuggestions } from "../lib/search";
export default function Products({ addToCart }) {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") || "").trim().toLowerCase();
  const sort = params.get("sort") || "featured";
  const selectedProduct = params.get("product");
  const valid = ["all", "vegetables", "fruits", "dairy", "essentials"].includes(
    category,
  );
  const matches = query
    ? getSearchSuggestions(products, query, products.length)
    : products;
  const filtered = matches.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!selectedProduct || String(p.id) === selectedProduct),
  );
  if (sort === "low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "high") filtered.sort((a, b) => b.price - a.price);
  return (
    <section className="container section-space">
      <p className="eyebrow">The fresh market</p>
      <h1 className="text-capitalize">
        {category === "all" ? "All groceries" : category + " products"}
      </h1>
      <p className="text-muted">Find something good for your everyday.</p>
      <div className="catalog-toolbar">
        <nav aria-label="Product categories" className="category-pills">
          {["all", "vegetables", "fruits", "dairy", "essentials"].map((c) => (
            <Link
              key={c}
              className={c === category ? "active" : ""}
              to={
                "/products/" +
                c +
                (query ? "?q=" + encodeURIComponent(query) : "")
              }
              aria-current={c === category ? "page" : undefined}
            >
              {c}
            </Link>
          ))}
        </nav>
        <div>
          <label className="visually-hidden" htmlFor="sort">
            Sort products
          </label>
          <select
            id="sort"
            className="form-select"
            value={sort}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("sort", e.target.value);
              setParams(next);
            }}
          >
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>
      <p role="status" className="small text-muted">
        {filtered.length} products
        {query && " matching “" + params.get("q") + "”"}
      </p>
      {!valid || !filtered.length ? (
        <div className="empty-state">
          <h2 className="h4">
            {valid ? "No matching products" : "Category not found"}
          </h2>
          <p>Try a different search or explore our full range.</p>
          <Link to="/products/all" className="btn btn-success">
            Browse all groceries
          </Link>
        </div>
      ) : (
        <div className="row g-3 g-lg-4">
          {filtered.map((product) => (
            <div className="col-6 col-md-4 col-xl-3" key={product.id}>
              <ProductCard product={product} addToCart={addToCart} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
