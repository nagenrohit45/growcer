import { useState } from "react";

const LoginModal = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (email === "digitinstitute@gmail.com" && password === "UIJAVA123") {
      localStorage.setItem("isLoggedIn", "true");
      onLogin();
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <h4 className="text-center mb-4">Login Required</h4>

        {error && <div className="alert alert-danger">{error}</div>}

        <input
          type="email"
          className="form-control mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-primary w-100" onClick={handleLogin}>
          Login
        </button>

        <div className="demo-credentials mt-4">
          <strong>Demo Credentials:</strong>
          <div>Email: digitinstitute@gmail.com</div>
          <div>Password: UIJAVA123</div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
