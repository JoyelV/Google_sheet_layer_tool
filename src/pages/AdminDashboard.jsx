import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import UserManagement from "../components/UserManagement";
import VehicleManagement from "../components/VehicleManagement";
import axios from "../api/axiosInstance";
import ProfileAndPassword from "../components/ProfileAndPassword";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("data");
  const [users, setUsers] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 10 });
  const [filters, setFilters] = useState({ page: 1, limit: 10, role: "", status: "", search: "" });
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  // FETCH USERS
  const fetchUsers = async ({ page = 1, limit = 10, role = "", status = "", search = "" }) => {
    setLoading(true);
    try {
      const res = await axios.get(`/users/?page=${page}&limit=${limit}&role=${role}&status=${status}&search=${encodeURIComponent(search)}`);
      console.log(res, "users");

      if (res.data.success) {
        setUsers(res.data.data.users || []);
        setPagination(res.data.data.pagination || { currentPage: page, totalPages: 1, totalUsers: 0, limit });
      } else {
        setUsers([]);
        setPagination({ currentPage: page, totalPages: 1, totalUsers: 0, limit });
        console.error("Failed to fetch users:", res.data.message);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
      setPagination({ currentPage: page, totalPages: 1, totalUsers: 0, limit });
    } finally {
      setLoading(false);
    }
  };

  // FETCH VEHICLES
  const fetchVehicles = async () => {
    try {
      const res = await axios.get("/vehicles/all");
      console.log("Full response:", res);
      const vehicles = res?.data?.data?.vehicles || res?.data?.vehicles || [];
      console.log("vehicles:", vehicles);
      setVehicleData(vehicles);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setVehicleData([]);
    }
  };

  useEffect(() => {
    fetchUsers(filters);
    fetchVehicles();
  }, []);

  // ADD VEHICLE
const addVehicle = async (formData) => {
  try {
    const res = await axios.post("/vehicles/insert", formData);

    if (res.data?.success) {
      alert("✅ Vehicle added successfully!");
      fetchVehicles();
    } else {
      alert(res.data?.message || "❌ Failed to add vehicle.");
    }
  } catch (err) {
    console.error("Error adding vehicle:", err.response?.data || err.message);
    alert("❌ Failed to add vehicle.");
  }
};

// EDIT VEHICLE (updated)
const editVehicle = async (updatedVehicle) => {
  try {
    const { id, ...data } = updatedVehicle; 
    const res = await axios.put(`/vehicles/${id}`, data);

    if (res.data?.success) {
      alert("✅ Vehicle updated successfully!");
      fetchVehicles();
    } else {
      alert(res.data?.message || "❌ Failed to update vehicle.");
    }
  } catch (err) {
    console.error("Error updating vehicle:", err.response?.data || err.message);
    alert("❌ Failed to update vehicle.");
  }
};

  // DELETE VEHICLE
  const deleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?"))
      return;

    try {
      await axios.delete(`/vehicles/${id}`);
      alert("🗑️ Vehicle deleted successfully!");
      fetchVehicles();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      alert("❌ Failed to delete vehicle.");
    }
  };

  // BULK INSERT VEHICLES
  const bulkInsertVehicles = async (file) => {
    if (!file) return alert("No file selected");

    const formData = new FormData();
    formData.append("csvFile", file);

    try {
      const res = await axios.post("/vehicles/bulk-insert", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Bulk insert response:", res.data);
      alert("✅ Bulk insert successful!");
      fetchVehicles();
    } catch (err) {
      console.error("Error in bulk insert:", err.response?.data || err.message);
      alert("❌ Bulk insert failed. See console for details.");
    }
  };

// LIST BULK INSERTIONS (corrected)
const listBulkInsertions = async () => {
  try {
    const res = await axios.get("/vehicles/batches/list");
    console.log("Bulk insertions:", res.data);

    // ✅ Correctly extract the array
    const list = res.data?.data || [];

    // ✅ Map to consistent display structure for the UI
    const formatted = list.map((batch) => ({
      batchId: batch.batchId,
      recordCount: batch.recordCount,
      createdAt: batch.createdAt,
      status: "Completed", // Add a static or derived value (since API doesn’t provide it)
    }));

    return formatted;
  } catch (err) {
    console.error("Error listing bulk insertions:", err);
    return [];
  }
};

  // DELETE BULK INSERTION
  const deleteBulkInsertion = async (batchId) => {
    if (!window.confirm("Are you sure you want to delete this bulk insertion?"))
      return;

    try {
      await axios.delete(`/vehicles/batch/${batchId}`);
      alert("🗑️ Bulk insertion deleted successfully!");
      fetchVehicles();
    } catch (err) {
      console.error("Error deleting bulk insertion:", err);
      alert("❌ Failed to delete bulk insertion");
    }
  };

// GET ROW HISTORY (returns parsed history with user info)
const getRowHistory = async (id) => {
  try {
    const res = await axios.get(`/vehicles/${id}/history`);
    console.log(`History for vehicle ${id}:`, res.data);

    const historyArray = res.data?.history || [];

    const formatted = historyArray.map((item) => ({
      updatedAt: item.createdAt,
      action: item.action,
      user: {
        name: item.user?.name || "Unknown",
        email: item.user?.email || "N/A",
      },
      changes: item.newValues || {},
    }));

    return formatted;
  } catch (err) {
    console.error("Error fetching row history:", err);
    return [];
  }
};

// REVERT VEHICLE CHANGES
const revertVehicleToHistory = async (vehicleId, historyId) => {
  if (!window.confirm("Are you sure you want to revert this vehicle to the selected version?"))
    return;

  try {
    const res = await axios.post(`/vehicles/${vehicleId}/revert/${historyId}`);

    if (res.data?.success) {
      alert("✅ Vehicle reverted successfully!");
      fetchVehicles(); // Refresh table
    } else {
      alert(res.data?.message || "❌ Failed to revert vehicle.");
    }
  } catch (err) {
    console.error("Error reverting vehicle:", err.response?.data || err.message);
    alert("❌ Failed to revert vehicle.");
  }
};

  // USER CRUD
  const addUser = async (newUser) => {
    try {
      const res = await axios.post("/users/", newUser);
      if (res.data.success) {
        await fetchUsers(filters);
        return { success: true };
      }
      return { success: false, message: res.data.message || "Failed to add user" };
    } catch (err) {
      console.error("Error adding user:", err);
      return { success: false, message: "Server error" };
    }
  };

  const editUser = async (user) => {
    const { id, name, email, role } = user;

    if (!name || !email || !role) {
      return { success: false, message: "Missing fields" };
    }

    try {
      const res = await axios.put(`/users/${id}`, { name, email, role });
      if (res.data.success) {
        await fetchUsers(filters);
        return { success: true, message: "User updated successfully" };
      } else {
        return { success: false, message: res.data.message || "Failed to update user" };
      }
    } catch (err) {
      console.error("Error updating user:", err);
      return { success: false, message: "Server error. Try again later." };
    }
  };

  const toggleBlock = async (user) => {
    try {
      const newStatus = user.status === "active" ? "blocked" : "active";
      const res = await axios.put(`/users/${user.id}`, { status: newStatus });
      if (res.data.success) {
        await fetchUsers(filters);
        return { success: true };
      } else {
        return { success: false };
      }
    } catch (err) {
      console.error("Error toggling user:", err);
      return { success: false };
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await axios.delete(`/users/${id}`);
      console.log(res, "deleteUser");
      await fetchUsers(filters);
      return { success: true };
    } catch (err) {
      console.error("Error deleting user:", err);
      return { success: false };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "data":
        return (
          <VehicleManagement
            vehicleData={vehicleData}
            addVehicle={addVehicle}
            editVehicle={editVehicle}
            deleteVehicle={deleteVehicle}
            bulkInsertVehicles={bulkInsertVehicles}
            getRowHistory={getRowHistory}
            listBulkInsertions={listBulkInsertions}
            deleteBulkInsertion={deleteBulkInsertion}
          />
        );

      case "users":
        return currentUser?.role === "admin" ? (
          <UserManagement
            users={users}
            addUser={addUser}
            editUser={editUser}
            deleteUser={deleteUser}
            toggleBlock={toggleBlock}
            loading={loading}
            pagination={pagination}
            fetchUsers={fetchUsers}
            filters={filters}
            setFilters={setFilters}
          />
        ) : (
          <p style={{ padding: "20px", textAlign: "center" }}>
            ❌ Access denied. Only admins can view this section.
          </p>
        );

      case "profile":
        return <ProfileAndPassword />;

      default:
        return <p>Invalid Tab</p>;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={currentUser?.role}
      />
      <div className="main-content">
        <Header />
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;