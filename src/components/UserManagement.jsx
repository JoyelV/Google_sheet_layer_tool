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
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

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
  currentUser,
}) => {
  const [editingRowId, setEditingRowId] = useState(null);
  const [editedUser, setEditedUser] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
  });
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
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    status: "",
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

  const editStatusOptions = [
    { label: "Active", value: "active" },
    { label: "Blocked", value: "blocked" },
  ];

  // Validation logic for both add and edit forms
  const validateUser = (user, isEdit = false) => {
    const newErrors = {};
    // Name validation
    if (!user.name.trim()) {
      newErrors.name = "Name is required";
    } else if (user.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    // Email validation
    if (!user.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.email)
    ) {
      newErrors.email = "Invalid email format";
    }

    // Role validation
    if (!user.role.trim()) {
      newErrors.role = "Role is required";
    } else if (!["admin", "editor", "viewer"].includes(user.role)) {
      newErrors.role = "Role must be admin, editor, or viewer";
    }

    // Password validation (required for add, not applicable for edit)
    if (!isEdit) {
      if (!user.password.trim()) {
        newErrors.password = "Password is required";
      } else {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(user.password);
        const hasLowerCase = /[a-z]/.test(user.password);
        const hasNumber = /[0-9]/.test(user.password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(user.password);

        if (user.password.length < minLength) {
          newErrors.password = "Password must be at least 8 characters long";
        } else if (!hasUpperCase) {
          newErrors.password =
            "Password must contain at least one uppercase letter";
        } else if (!hasLowerCase) {
          newErrors.password =
            "Password must contain at least one lowercase letter";
        } else if (!hasNumber) {
          newErrors.password = "Password must contain at least one number";
        } else if (!hasSpecialChar) {
          newErrors.password =
            'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
        }
      }
    }

    // Status validation (for edit only)
    if (isEdit) {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id === storedUser?.id && user.status === "blocked") {
        newErrors.status = "Cannot block your own account";
      } else if (!user.status.trim()) {
        newErrors.status = "Status is required";
      } else if (!["active", "blocked"].includes(user.status)) {
        newErrors.status = "Status must be active or blocked";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const id = Number(searchInput.trim());
      if (id > 0) {
        setFilters((prev) => ({ ...prev, role: "", status: "" }));
        fetchUserById(id);
      } else {
        setSearchedUser(null);
        fetchUsers(filters);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Handle filter changes
  const handleFilterChange = (key, selectedOption) => {
    const value = selectedOption?.value ?? selectedOption ?? "";
    const newFilters = { ...filters, [key]: value, page: 1 };
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

  // Edit handlers
  const handleEditClick = (user) => {
    setEditingRowId(user.id);
    setEditedUser({ ...user, status: user.status || "active" });
  };

  const handleSaveClick = async () => {
    if (!validateUser(editedUser, true)) return;
    const result = await editUser(editedUser);
    if (result?.success) {
      toast.success(result.message);
      setEditingRowId(null);
      setEditedUser({});
      if (searchInput.trim()) {
        fetchUserById(searchInput.trim());
      }
    } else {
      toast.error(result?.message || "Failed to update user");
    }
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditedUser({});
    setErrors({});
    toast.info("Edit cancelled");
  };

  // Add handler
  const handleAddUser = async () => {
    if (!validateUser(newUser)) return;
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

  // Confirmation dialog handlers
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
      fetchUserById(searchInput.trim());
    }
  };

  // Block/unblock
  const handleToggleBlock = async (user) => {
    if (user.email === currentUser?.email) {
      toast.warning("⚠️ You cannot block your own account!");
      return;
    }

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

  // Delete
  const handleDelete = async (user) => {
    if (user.email === currentUser?.email) {
      toast.warning("⚠️ You cannot delete your own account!");
      return;
    }

    try {
      const result = await deleteUser(user.id);
      if (result?.success) {
        toast.success("🗑️ User deleted successfully!");
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
        <div
          className="action-buttons"
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
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
                          setEditedUser({
                            ...editedUser,
                            email: e.target.value,
                          })
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
                    {editingRowId === u.id ? (
                      <div>
                        <select
                          value={editedUser.status}
                          onChange={(e) =>
                            setEditedUser({
                              ...editedUser,
                              status: e.target.value,
                            })
                          }
                          disabled={u.email === currentUser?.email} // ✅ disable only for self
                        >
                          <option value="active">Active</option>
                          <option value="blocked">Blocked</option>
                        </select>
                        {errors.status && (
                          <small className="error-text">{errors.status}</small>
                        )}
                      </div>
                    ) : u.status === "deleted" ? (
                      "Deleted"
                    ) : u.status === "blocked" ? (
                      "Blocked"
                    ) : (
                      "Active"
                    )}
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
                          disabled={
                            editingRowId === u.id ||
                            u.email === currentUser?.email
                          }
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
                          disabled={
                            u.status === "deleted" ||
                            u.email === currentUser?.email
                          }
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
