import React, { useState, useEffect } from "react";
import axios from "../../src/api/axiosInstance"; 
import secureLocalStorage from "react-secure-storage";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';  
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    const storedUser = secureLocalStorage.getItem("user");
    if (storedUser && typeof storedUser === "object") {
      setUser(storedUser);
    } else {
      console.error("Invalid user data or no user found");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = async () => {
    const token = secureLocalStorage.getItem("token");
    try {
      if (token) {
        await axios.post(
          "/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      toast.success("You have successfully logged out"); 
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed!"); 
    } finally {
      secureLocalStorage.removeItem("token");
      secureLocalStorage.removeItem("user");
      setTimeout(() => navigate("/login"), 500);
    }
  };

  return (
    <header className="header-bar">
      <div className="user-info">
        <span>{user.name || "Guest"}</span> | <span>{user.role || "No Role"}</span>
      </div>
      <div className="header-actions">
        <button className="btn logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Toast container to display messages */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </header>
  );
};

export default Header;
