import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../src/api/axiosInstance";
import secureLocalStorage from "react-secure-storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("All fields are required");
    setError("");
    setLoading(true);
    try {
      const { data, headers } = await axios.post("/api/auth/login", { email, password });
      console.log("Login API Response:", data); 
      console.log("Set-Cookie Header:", headers["set-cookie"] || "No cookies set"); 

      secureLocalStorage.setItem("token", data.data.accessToken);
      secureLocalStorage.setItem("user", {
        name: data.data.user.name,
        email: data.data.user.email,
        role: data.data.user.role,
      });

      toast.success(data.message || "Logged in successfully!", {
        position: "top-right",
        autoClose: 2000,
        theme: "colored",
      });
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message); 
      setError(err.response?.data?.message || "Login failed");
      toast.error(err.response?.data?.message || "Invalid credentials", {
        position: "top-right",
        autoClose: 2000,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail)
      return toast.error("Please enter your registered email address");
    try {
      const { data } = await axios.post("/api/auth/forgot-password", {
        email: forgotEmail,
      });
      toast.success(data.message || "OTP sent to your email", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      setResetData((prev) => ({ ...prev, email: forgotEmail }));
      setShowForgotModal(false);
      setShowResetModal(true);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send reset email",
        {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        }
      );
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { email, otp, newPassword } = resetData;
    if (!email || !otp || !newPassword)
      return toast.error("All fields are required");
    try {
      const { data } = await axios.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      toast.success(data.message || "Password reset successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      setShowResetModal(false);
      setResetData({ email: "", otp: "", newPassword: "" });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to reset password",
        {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        }
      );
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
          <div className="login-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </button>
          </div>
        </form>
        <p className="footer-text">Secure access to Google Sheets</p>
      </div>
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Forgot Password</h3>
            <p>Enter your registered email to receive a reset OTP.</p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <div className="modal-buttons">
                <button type="submit">Send OTP</button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reset Your Password</h3>
            <p>Enter the OTP sent to your email and your new password.</p>
            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                placeholder="Email address"
                value={resetData.email}
                onChange={(e) =>
                  setResetData({ ...resetData, email: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Enter OTP"
                value={resetData.otp}
                onChange={(e) =>
                  setResetData({ ...resetData, otp: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={resetData.newPassword}
                onChange={(e) =>
                  setResetData({ ...resetData, newPassword: e.target.value })
                }
                required
              />
              <div className="modal-buttons">
                <button type="submit">Reset Password</button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer
  closeButton={({ closeToast }) => (
    <button
      className="custom-toast-close"
      onClick={closeToast}
      style={{ background: "none", border: "none", cursor: "pointer" }}
    >
      <i className="fas fa-times" style={{ color: "var(--color-text-secondary)", fontSize: "1.2rem" }}></i>
    </button>
  )}
/>
    </div>
  );
};

export default Login;