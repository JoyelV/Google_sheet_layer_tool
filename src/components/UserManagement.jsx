import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import axios from "../api/axiosInstance";
import "react-toastify/dist/ReactToastify.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

const UserManagement = ({
  users,
  toggleBlock,
  deleteUser,
  addUser,
  editUser,
  loading,
  pagination,
  fetchUsers,
  filters,
  setFilters,
}) => {
  const [editingRowId, setEditingRowId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Confirmation modal states
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  });

  // Filter options
  const roleOptions = [
    { label: "All Roles", value: "" },
    { label: "Admin", value: "admin" },
    { label: "Editor", value: "editor" },
    { label: "Viewer", value: "viewer" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Active", value: "active" },
    { label: "Blocked", value: "blocked" },
    { label: "Deleted", value: "deleted" },
  ];

  // Fetch user by ID from backend
  const fetchUserById = async (id) => {
    if (!id) {
      setSearchedUser(null);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await axios.get(`/users/${id}`);
      if (res.data.success && res.data.data.user) {
        setSearchedUser(res.data.data.user);
      } else {
        setSearchedUser(null);
        toast.error("User not found");
      }
    } catch (err) {
      console.error("Error fetching user by ID:", err);
      setSearchedUser(null);
      toast.error("Failed to fetch user");
    } finally {
      setSearchLoading(false);
    }
  };

// Debounce search input (fetch only if > 0)
useEffect(() => {
  const delayDebounceFn = setTimeout(() => {
    const id = Number(searchInput.trim());
    if (id > 0) {
      // Clear role and status when searching by ID
      setFilters((prev) => ({ ...prev, role: "", status: "" }));
      fetchUserById(id);
    } else {
      // If cleared or invalid, show all users again
      setSearchedUser(null);
      fetchUsers(filters);
    }
  }, 500);

  return () => clearTimeout(delayDebounceFn);
}, [searchInput]);

// Handle filter changes (role, status)
const handleFilterChange = (key, selectedOption) => {
  // Extract the value correctly
  const value = selectedOption?.value ?? selectedOption ?? "";

  const newFilters = { ...filters, [key]: value, page: 1 };

  // Clear search input when filter is used
  setSearchInput("");
  setSearchedUser(null);

  setFilters(newFilters);
  fetchUsers(newFilters);
};

  // Handle pagination change
  const handlePageChange = (event, page) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchUsers(newFilters);
  };

  // EDIT
  const handleEditClick = (user) => {
    setEditingRowId(user.id);
    setEditedUser({ ...user });
  };

  const handleSaveClick = async () => {
    const result = await editUser(editedUser);
    if (result?.success) {
      toast.success(result.message);
      setEditingRowId(null);
      setEditedUser({});
      if (searchInput.trim()) {
        fetchUserById(searchInput.trim()); // Refresh searched user
      }
    } else {
      toast.error(result?.message || "Failed to update user");
    }
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditedUser({});
    toast.info("Edit cancelled");
  };

  // ADD
  const handleAddUser = async () => {
    if (!validateUser()) return;

    const result = await addUser(newUser);
    if (result?.success) {
      toast.success("✅ User added successfully!");
      setShowAddModal(false);
      setNewUser({ name: "", email: "", role: "", password: "" });
      setErrors({});
    } else {
      toast.error(result?.message || "❌ Failed to add user.");
    }
  };

  // VALIDATION
  const validateUser = () => {
    const newErrors = {};
    if (!newUser.name.trim()) newErrors.name = "Name is required";
    if (!newUser.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newUser.email))
      newErrors.email = "Invalid email format";
    if (!newUser.role.trim()) newErrors.role = "Role is required";
    if (!newUser.password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CONFIRMATION DIALOG HANDLERS
  const openConfirmDialog = (user, actionType) => {
    setSelectedUser(user);
    setConfirmAction(actionType);
    setConfirmMessage(
      actionType === "block"
        ? `Are you sure you want to ${
            user.status === "blocked" ? "unblock" : "block"
          } this user?`
        : "Are you sure you want to delete this user?"
    );
    setConfirmDialogVisible(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === "block") {
      await handleToggleBlock(selectedUser);
    } else if (confirmAction === "delete") {
      await handleDelete(selectedUser);
    }
    setConfirmDialogVisible(false);
    setSelectedUser(null);
    setConfirmAction(null);
    if (searchInput.trim()) {
      fetchUserById(searchInput.trim()); // Refresh searched user
    }
  };

  // BLOCK/UNBLOCK
  const handleToggleBlock = async (user) => {
    try {
      const result = await toggleBlock(user);
      if (result?.success) {
        const action = user.status === "blocked" ? "unblocked" : "blocked";
        toast.success(`✅ User ${action} successfully!`);
      } else {
        toast.error("Failed to update user status.");
      }
    } catch {
      toast.error("Something went wrong!");
    }
  };

  // DELETE
  const handleDelete = async (user) => {
    try {
      const result = await deleteUser(user.id);
      if (result?.success) {
        toast.success("🗑️ User deleted successfully!");
        if (searchInput.trim() && user.id === Number(searchInput)) {
          setSearchedUser(null); // Clear searched user if deleted
        }
      } else {
        toast.error("Failed to delete user.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("❌ Failed to delete user");
    }
  };

  if (loading || searchLoading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading users...</p>
      </div>
    );

  const renderAddUserDialogFooter = () => (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
      <button className="btn cancel" onClick={() => setShowAddModal(false)}>
        Cancel
      </button>
      <button className="btn save" onClick={handleAddUser}>
        Add User
      </button>
    </div>
  );

  // Determine which users to display
  const displayUsers = searchedUser ? [searchedUser] : users;

  return (
    <section className="content-section">
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      {/* Confirm Action Dialog */}
      <Dialog
        header="Confirm Action"
        visible={confirmDialogVisible}
        style={{ width: "350px" }}
        onHide={() => setConfirmDialogVisible(false)}
        footer={
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
            <button
              className="btn cancel"
              onClick={() => setConfirmDialogVisible(false)}
            >
              Cancel
            </button>
            <button className="btn save" onClick={handleConfirmAction}>
              Confirm
            </button>
          </div>
        }
      >
        <p>{confirmMessage}</p>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        header="Add New User"
        visible={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setErrors({});
        }}
        style={{ width: "400px" }}
        footer={renderAddUserDialogFooter()}
      >
        <div className="add-user-form">
          <div className="form-group">
            <label>Name</label>
            <InputText
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Enter name"
            />
            {errors.name && <small className="error-text">{errors.name}</small>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <InputText
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              placeholder="Enter email"
            />
            {errors.email && (
              <small className="error-text">{errors.email}</small>
            )}
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="p-inputtext"
            >
              <option value="" disabled>
                Select role
              </option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            {errors.role && <small className="error-text">{errors.role}</small>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <InputText
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              placeholder="Enter password"
            />
            {errors.password && (
              <small className="error-text">{errors.password}</small>
            )}
          </div>
        </div>
      </Dialog>

      {/* User Table */}
      <div className="crud-actions">
        <h1 className="section-title">User Management</h1>
        <div className="action-buttons" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <InputText
            type="number"
            placeholder="Search by user ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ marginBottom: "10px", width: "250px" }}
          />
          <Dropdown
            value={filters.role}
            options={roleOptions}
            onChange={(e) => handleFilterChange("role", e.value)}
            placeholder="Select Role"
            style={{ marginBottom: "10px", width: "150px" }}
          />
          <Dropdown
            value={filters.status}
            options={statusOptions}
            onChange={(e) => handleFilterChange("status", e.value)}
            placeholder="Select Status"
            style={{ marginBottom: "10px", width: "150px" }}
          />
          <button className="btn add-row" onClick={() => setShowAddModal(true)}>
            <i className="pi pi-plus" style={{ marginRight: "4px" }} /> Add
          </button>
        </div>
      </div>

      <p className="section-subtitle">Manage admins, editors, and viewers</p>

      {/* User Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No users found
                </td>
              </tr>
            ) : (
              displayUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    {editingRowId === u.id ? (
                      <InputText
                        value={editedUser.name}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, name: e.target.value })
                        }
                      />
                    ) : (
                      u.name
                    )}
                  </td>
                  <td>
                    {editingRowId === u.id ? (
                      <InputText
                        value={editedUser.email}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, email: e.target.value })
                        }
                      />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td>
                    {editingRowId === u.id ? (
                      <select
                        value={editedUser.role}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, role: e.target.value })
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      u.role
                    )}
                  </td>
                  <td>
                    {u.status === "deleted"
                      ? "Deleted"
                      : u.status === "blocked"
                      ? "Blocked"
                      : "Active"}
                  </td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    {editingRowId === u.id ? (
                      <>
                        <button
                          className="icon-btn save"
                          onClick={handleSaveClick}
                        >
                          <i className="pi pi-check" />
                        </button>
                        <button
                          className="icon-btn cancel"
                          onClick={handleCancelClick}
                        >
                          <i className="pi pi-times" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="icon-btn edit"
                          onClick={() => handleEditClick(u)}
                        >
                          <i className="pi pi-pencil" />
                        </button>
                        <button
                          className="icon-btn toggle"
                          onClick={() => openConfirmDialog(u, "block")}
                        >
                          {u.status === "blocked" ? (
                            <i className="pi pi-unlock" />
                          ) : (
                            <i className="pi pi-lock" />
                          )}
                        </button>
                        <button
                          className={`icon-btn delete ${
                            u.status === "deleted" ? "disabled" : ""
                          }`}
                          onClick={() => {
                            if (u.status !== "deleted")
                              openConfirmDialog(u, "delete");
                          }}
                          disabled={u.status === "deleted"}
                        >
                          <i className="pi pi-trash" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {!searchedUser && pagination.totalPages > 1 && (
          <Stack spacing={2} alignItems="center" sx={{ marginTop: "10px" }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
            />
          </Stack>
        )}
      </div>
    </section>
  );
};

export default UserManagement;