import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Navbar from "./Components/Layout/Navbar";
import Home from "./Pages/Home";
import Categories from "./Components/Categories/Categories";
import Footer from "./Components/Layout/Footer";
import Products from "./Pages/Products";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import OrderSuccess from "./Pages/OrderSuccess";
import LoginModal from "./Components/Auth/LoginModal";

const App = () => {
  //===================Search Bar=================
  const [searchQuery, setSearchQuery] = useState("");

  // ================= CART STATE =================
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // ================= LOGIN STATE =================
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedLogin = localStorage.getItem("isLoggedIn");
    if (savedLogin === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  // ===================User Scroll=====================

  useEffect(() => {
    if (!isLoggedIn) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isLoggedIn]);

  // Save cart in localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ================= ADD TO CART =================
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  return (
    <>
      {/* ================= LOGIN MODAL ================= */}
      {!isLoggedIn && <LoginModal onLogin={() => setIsLoggedIn(true)} />}

      {/* ================= MAIN APP ================= */}
      <Navbar
        cart={cart}
        onLogout={() => setIsLoggedIn(false)}
        setSearchQuery={setSearchQuery}
      />

      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} />} />

        <Route path="/categories" element={<Categories />} />

        
        <Route
          path="/products/:category"
          element={<Products addToCart={addToCart} searchQuery={searchQuery} />}
        />

        

        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />

        <Route
          path="/checkout"
          element={<Checkout cart={cart} setCart={setCart} />}
        />

        <Route path="/order-success" element={<OrderSuccess />} />
      </Routes>

      <Footer />
    </>
  );
};

export default App;
