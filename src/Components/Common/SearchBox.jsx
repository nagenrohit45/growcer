import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { products } from "../../Data/products";
import { getSearchSuggestions } from "../../lib/search";
import { money } from "../../lib/client";

export default function SearchBox({ initialQuery = "", onNavigate }) {
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const suggestions = getSearchSuggestions(products, query);
  const show = expanded && query.trim().length > 0;
  const finish = (destination) => {
    setExpanded(false);
    setActive(-1);
    onNavigate();
    navigate(destination);
  };
  const searchAll = (event) => {
    event.preventDefault();
    const text = query.trim();
    finish("/products/all" + (text ? "?q=" + encodeURIComponent(text) : ""));
  };
  const choose = (product) => {
    setQuery(product.name);
    finish(
      `/products/${product.category}?q=${encodeURIComponent(product.name)}&product=${product.id}`,
    );
  };
  const keyboard = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setExpanded(false);
      setActive(-1);
    } else if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      suggestions.length
    ) {
      event.preventDefault();
      setExpanded(true);
      setActive((current) =>
        event.key === "ArrowDown"
          ? (current + 1) % suggestions.length
          : current <= 0
            ? suggestions.length - 1
            : current - 1,
      );
    } else if (event.key === "Enter" && show && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    }
  };
  return (
    <div
      className="search-shell"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setExpanded(false);
      }}
    >
      <form role="search" className="search-form" onSubmit={searchAll}>
        <label className="visually-hidden" htmlFor="product-search">
          Search groceries
        </label>
        <input
          id="product-search"
          name="q"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls={show ? "search-suggestions" : undefined}
          aria-activedescendant={
            show && active >= 0
              ? `suggestion-${suggestions[active].id}`
              : undefined
          }
          placeholder="Search rice, milk, vegetables…"
          autoComplete="off"
          value={query}
          maxLength="100"
          onKeyDown={keyboard}
          onFocus={() => setExpanded(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setExpanded(true);
            setActive(-1);
          }}
        />
        <button type="submit" aria-label="Search groceries">
          Search
        </button>
      </form>
      {show && (
        <div className="search-dropdown">
          <div className="suggestions-heading">
            {suggestions.length
              ? "Suggested groceries"
              : "No matching groceries"}
          </div>
          <ul
            id="search-suggestions"
            role="listbox"
            aria-label="Grocery suggestions"
          >
            {suggestions.map((product, index) => (
              <li
                key={product.id}
                role="option"
                id={`suggestion-${product.id}`}
                aria-selected={index === active}
              >
                <button
                  type="button"
                  className={index === active ? "is-active" : ""}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(product)}
                >
                  <img src={product.image} alt="" width="44" height="44" />
                  <span className="suggestion-label">
                    <strong>{product.name}</strong>
                    <small>
                      {product.unit} · {product.category}
                    </small>
                  </span>
                  <span className="suggestion-price">
                    {money(product.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!suggestions.length && (
            <p className="suggestions-empty">
              Try a product name such as milk, rice or tomato.
            </p>
          )}
          {suggestions.length > 0 && (
            <button
              type="button"
              className="suggestions-all"
              onMouseDown={(event) => event.preventDefault()}
              onClick={searchAll}
            >
              See all results for “{query.trim()}” →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
