import { useLocation, Link } from "react-router-dom";

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state;

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <h3>No order data found.</h3>
        <Link to="/" className="btn btn-primary mt-3">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">

          <div className="card shadow-sm p-4 border-0">
            <h2 className="text-success mb-3">
              Order Placed Successfully!
            </h2>

            <p><strong>Order ID:</strong> {order.orderId}</p>

            <hr />

            <h5>Customer Details</h5>
            <p><strong>Name:</strong> {order.customer.name}</p>
            <p><strong>Phone:</strong> {order.customer.phone}</p>
            <p><strong>Address:</strong> {order.customer.address}, {order.customer.city}</p>
            <p><strong>Payment Method:</strong> {order.customer.payment.toUpperCase()}</p>

            <hr />

            <h5>Order Summary</h5>

            {order.items.map(item => (
              <div key={item.id} className="d-flex justify-content-between mb-2">
                <span>{item.name} (x{item.quantity})</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}

            <hr />

            <h5 className="d-flex justify-content-between">
              <span>Total Paid</span>
              <span>₹{order.total.toFixed(0)}</span>
            </h5>

            <Link to="/" className="btn btn-primary w-100 mt-4">
              Continue Shopping
            </Link>

          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
