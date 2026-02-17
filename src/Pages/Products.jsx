import { useParams } from "react-router-dom";

import tomatoImg from "../assets/Images/Category img/Vegetables/tomato.jpg";
import potatoImg from "../assets/Images/Category img/Vegetables/potato.jpg";
import onionImg from "../assets/Images/Category img/Vegetables/onion.jpg";
import carrotImg from "../assets/Images/Category img/Vegetables/carrot.jpg";
import cabbageImg from "../assets/Images/Category img/Vegetables/cabbage.jpg";

import appleImg from "../assets/Images/Category img/Fruits/apple.jpg";
import bananaImg from "../assets/Images/Category img/Fruits/banana.jpg";
import orangeImg from "../assets/Images/Category img/Fruits/orange.jpg";
import mangoImg from "../assets/Images/Category img/Fruits/mango.jpg";
import grapesImg from "../assets/Images/Category img/Fruits/grape.jpg";

import milkImg from "../assets/Images/Category img/Dairy/milk.jpg";
import curdImg from "../assets/Images/Category img/Dairy/curd.jpg";
import butterImg from "../assets/Images/Category img/Dairy/butter.jpg";
import paneerImg from "../assets/Images/Category img/Dairy/paneer.jpg";
import cheeseImg from "../assets/Images/Category img/Dairy/cheese.jpg";

import riceImg from "../assets/Images/Category img/Essentials/rice.jpg";
import dalImg from "../assets/Images/Category img/Essentials/dal.jpg";
import sugarImg from "../assets/Images/Category img/Essentials/sugar.jpg";
import saltImg from "../assets/Images/Category img/Essentials/salt.jpg";
import oilImg from "../assets/Images/Category img/Essentials/oil.jpg";

const productsData = [
  // ================= VEGETABLES =================
  {
    id: 1,
    name: "Tomato",
    price: 40,
    category: "vegetables",
    image: tomatoImg,
  },
  {
    id: 2,
    name: "Potato",
    price: 30,
    category: "vegetables",
    image: potatoImg,
  },
  { id: 3, name: "Onion", price: 35, category: "vegetables", image: onionImg },
  {
    id: 4,
    name: "Carrot",
    price: 50,
    category: "vegetables",
    image: carrotImg,
  },
  {
    id: 5,
    name: "Cabbage",
    price: 45,
    category: "vegetables",
    image: cabbageImg,
  },

  // ================= FRUITS =================
  { id: 6, name: "Apple", price: 120, category: "fruits", image: appleImg },
  { id: 7, name: "Banana", price: 50, category: "fruits", image: bananaImg },
  { id: 8, name: "Orange", price: 80, category: "fruits", image: orangeImg },
  { id: 9, name: "Mango", price: 150, category: "fruits", image: mangoImg },
  { id: 10, name: "Grapes", price: 90, category: "fruits", image: grapesImg },

  // ================= DAIRY =================
  { id: 11, name: "Milk", price: 55, category: "dairy", image: milkImg },
  { id: 12, name: "Curd", price: 40, category: "dairy", image: curdImg },
  { id: 13, name: "Butter", price: 60, category: "dairy", image: butterImg },
  { id: 14, name: "Paneer", price: 80, category: "dairy", image: paneerImg },
  { id: 15, name: "Cheese", price: 120, category: "dairy", image: cheeseImg },

  // ================= ESSENTIALS =================
  {
    id: 16,
    name: "Rice (1kg)",
    price: 60,
    category: "essentials",
    image: riceImg,
  },
  {
    id: 17,
    name: "Toor Dal",
    price: 110,
    category: "essentials",
    image: dalImg,
  },
  { id: 18, name: "Sugar", price: 45, category: "essentials", image: sugarImg },
  { id: 19, name: "Salt", price: 20, category: "essentials", image: saltImg },
  {
    id: 20,
    name: "Cooking Oil",
    price: 150,
    category: "essentials",
    image: oilImg,
  },
];

const Products = ({ addToCart, searchQuery }) => {
  const { category } = useParams(); // 🔥 CORE LINE

  let filteredProducts;

  if (category === "all") {
    filteredProducts = productsData;
  } else {
    filteredProducts = productsData.filter(
      (product) => product.category === category,
    );
  }

  if (searchQuery) {
    filteredProducts = filteredProducts.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  return (
    <div className="container py-5">
      <h2 className="mb-5 fw-bold text-center text-capitalize">
        {category} Products
      </h2>

      <div className="row">
        {filteredProducts.length === 0 ? (
          <p>No products found.</p>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="col-lg-4 col-md-6 mb-4">
              <div className="card shadow-sm h-100 border-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="card-img-top"
                  style={{ height: "200px", objectFit: "cover" }}
                />

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{product.name}</h5>

                  <p className="fw-bold text-success fs-5">₹{product.price}</p>

                  <button
                    className="btn btn-success mt-auto"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Products;
