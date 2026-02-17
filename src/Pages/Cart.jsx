import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Cart = ({ cart, setCart }) => {

  const navigate = useNavigate();

  const [selectedCoupon, setSelectedCoupon] = useState("");

  // Increase quantity
  const increaseQty = (id) => {
    setCart(
      cart.map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQty = (id) => {
    setCart(
      cart
        .map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  // Remove item
  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate subtotal
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Coupon discount logic
  let calculatedDiscount = 0;

  if (selectedCoupon === "SAVE10") {
    calculatedDiscount = subtotal * 0.10;
  } 
  else if (selectedCoupon === "FLAT50") {
    calculatedDiscount = 50;
  } 
  else if (selectedCoupon === "FREESHIP") {
    calculatedDiscount = 30;
  }

  const totalPrice = subtotal - calculatedDiscount;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">

          <h2 className="mb-4 text-center">Your Cart</h2>

          {cart.length === 0 ? (
            <p className="text-center">Your cart is empty.</p>
          ) : (
            <>
              {/* Cart Items */}
              {cart.map(item => (
                <div key={item.id} className="card shadow-sm mb-4 border-0">
                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>
                        <h5 className="mb-1">{item.name}</h5>
                        <small className="text-muted">₹{item.price} each</small>
                      </div>

                      <div className="d-flex align-items-center gap-3">

                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => decreaseQty(item.id)}
                        >
                          -
                        </button>

                        <span className="fw-bold">{item.quantity}</span>

                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => increaseQty(item.id)}
                        >
                          +
                        </button>

                      </div>

                      <div className="fw-bold">
                        ₹{item.price * item.quantity}
                      </div>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>

                    </div>

                  </div>
                </div>
              ))}

              {/* Coupon Section */}
              <div className="card shadow-sm p-4 mb-4">
                <h6 className="mb-3">Select Coupon</h6>

                <select
                  className="form-select"
                  value={selectedCoupon}
                  onChange={(e) => setSelectedCoupon(e.target.value)}
                >
                  <option value="">No Coupon</option>
                  <option value="SAVE10">SAVE10 - 10% Off</option>
                  <option value="FLAT50">FLAT50 - ₹50 Off</option>
                  <option value="FREESHIP">FREESHIP - ₹30 Off</option>
                </select>
              </div>

              {/* Total Section */}
              <div className="card shadow-sm p-4 border-0">

                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                {calculatedDiscount > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount</span>
                    <span>- ₹{calculatedDiscount.toFixed(0)}</span>
                  </div>
                )}

                <hr />

                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(0)}</span>
                </div>

                <button
                  className="btn btn-success w-100 mt-3"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </button>

              </div>

            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Cart;
