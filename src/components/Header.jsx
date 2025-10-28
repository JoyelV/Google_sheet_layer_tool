import React, { useState, useEffect } from "react";
import axios from "../../src/api/axiosInstance"; 
import secureLocalStorage from "react-secure-storage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
            toast.success("You have been logged out successfully!");

    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      secureLocalStorage.removeItem("token");
      secureLocalStorage.removeItem("user");
       setTimeout(() => {
        navigate("/login");
      }, 1000); 
    }
  };

  return (
    <header className="header-bar">
      <div className="user-info">
        <span>{user.name || "Guest"}</span> | <span> Role: {user.role || "No Role"}</span>
      </div>
      <div className="header-actions">
        <button className="btn logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;