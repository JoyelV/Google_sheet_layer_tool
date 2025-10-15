import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../src/api/axiosInstance";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("All fields are required");
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post("/auth/login", { email, password });

      // Save token
      localStorage.setItem("token", data.data.accessToken);

      // Save user info
      const { name, email: userEmail, role } = data.data.user;
      localStorage.setItem(
        "user",
        JSON.stringify({ name, email: userEmail, role })
      );

      // Toast success
      toast.success(data.message || "Logged in successfully!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        theme: "colored",
      });

      // Redirect to /admin for all roles
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      toast.error(err.response?.data?.message || "Invalid credentials", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">
          <i className="fas fa-lock"></i>
        </div>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to access your dashboard</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-envelope"></i>
              <input
                id="email"
                type="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email">Email Address</label>
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <i className="fas fa-lock"></i>
              <input
                id="password"
                type="password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password">Password</label>
            </div>
          </div>

          {error && <p className="global-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="footer-text">Secure access to Google Sheets</p>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Login;