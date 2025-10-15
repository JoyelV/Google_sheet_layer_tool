import React, { useEffect, useState, useRef } from "react";
import axios from "../api/axiosInstance";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./ProfileAndPassword.css";

const ProfileAndPassword = () => {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const toast = useRef(null);

  // Toast handler
  const showToast = (type, summary, detail) => {
    toast.current.show({
      severity: type,
      summary,
      detail,
      life: 3000,
    });
  };

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await axios.get("/auth/profile");
      if (res.data.success) {
        setProfile(res.data.data.user);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      showToast("error", "Error", "Failed to fetch profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Password validation logic
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long.";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!hasNumber) {
      return "Password must contain at least one number.";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>).";
    }
    return null;
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      return showToast("warn", "Missing Fields", "Please fill in all fields.");
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return showToast("warn", "Invalid Password", passwordError);
    }

    setLoadingPassword(true);
    try {
      const res = await axios.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        showToast("success", "Password Updated", "Your password has been changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        showToast("error", "Failed", res.data.message || "Password update failed.");
      }
    } catch (err) {
      console.error("Error changing password:", err.response?.data || err.message);
      showToast("error", "Error", err.response?.data?.message || "Failed to change password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="content-profile">
      {/* Toast Notification */}
      <Toast ref={toast} />

      {/* Profile Section */}
      <div className="profile-card">
        <h2 className="profile-title">Profile</h2>
        {loadingProfile ? (
          <div className="spinner-container">
            <ProgressSpinner style={{ width: "50px", height: "50px" }} strokeWidth="4" />
            <p>Loading profile...</p>
          </div>
        ) : profile ? (
          <>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Role:</strong> {profile.role}</p>
            <p><strong>Status:</strong> {profile.status}</p>
            <p><strong>Created At:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(profile.updatedAt).toLocaleString()}</p>
          </>
        ) : (
          <p>No profile data available.</p>
        )}
      </div>

      {/* Change Password Section */}
      <form className="form-card" onSubmit={handleChangePassword}>
        <h2 className="section-title">Change Password</h2>
        <div className="form-group">
          <label>Current Password:</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loadingPassword}>
          {loadingPassword ? (
            <>
              <i className="pi pi-spin pi-spinner" style={{ marginRight: "8px" }}></i>
              Updating...
            </>
          ) : (
            "Change Password"
          )}
        </button>
      </form>
    </div>
  );
};

export default ProfileAndPassword;