export function getSearchSuggestions(products, input, limit = 6) {
  const query = input.trim().toLowerCase();
  if (!query) return [];
  const words = query.split(/\s+/);
  return products
    .filter((product) => {
      const searchable =
        `${product.name} ${product.category} ${product.unit}`.toLowerCase();
      return words.every((word) => searchable.includes(word));
    })
    .sort(
      (a, b) =>
        Number(b.name.toLowerCase().startsWith(query)) -
        Number(a.name.toLowerCase().startsWith(query)),
    )
    .slice(0, limit);
}
