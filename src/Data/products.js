import { catalog } from "../../shared/catalog";
const assets = import.meta.glob("../assets/images/**/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});
export const products = catalog.map((p) => ({
  ...p,
  image: assets["../assets/images/" + p.image],
}));
export const featured = [1, 6, 102, 103].map((id) =>
  products.find((p) => p.id === id),
);
