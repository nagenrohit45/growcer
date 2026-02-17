import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Checkout = ({ cart, setCart }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    payment: "cod"
  });

  const [error, setError] = useState("");

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = () => {
    if (!formData.name || !formData.phone || !formData.address || !formData.city) {
      setError("Please fill all required fields.");
      return;
    }

    setError("");

    const orderData = {
      orderId: "ORD" + Date.now(),
      items: cart,
      total: totalPrice,
      customer: formData
    };

    setCart([]);

    navigate("/order-success", { state: orderData });
  };

  // Handle empty cart
  if (cart.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h3>Your cart is empty.</h3>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">

        {/* Left Side - Form */}
        <div className="col-lg-7">
          <h3 className="mb-4">Delivery Details</h3>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">City</label>
            <input
              type="text"
              className="form-control"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              name="payment"
              value={formData.payment}
              onChange={handleChange}
            >
              <option value="cod">Cash on Delivery</option>
              <option value="card">Credit / Debit Card</option>
            </select>
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="col-lg-5">
          <div className="card shadow-sm p-4">
            <h5 className="mb-3">Order Summary</h5>

            {cart.map(item => (
              <div key={item.id} className="d-flex justify-content-between mb-2">
                <span>{item.name} (x{item.quantity})</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}

            <hr />

            <h5 className="d-flex justify-content-between">
              <span>Total</span>
              <span>₹{totalPrice.toFixed(0)}</span>
            </h5>

            <button
              className="btn btn-success w-100 mt-3"
              onClick={handlePlaceOrder}
            >
              Place Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
