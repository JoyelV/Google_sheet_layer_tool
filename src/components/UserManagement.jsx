import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import "react-toastify/dist/ReactToastify.css";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import './UserManagement.css'

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

  const prevFiltersRef = useRef(filters);

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

  const validateUser = (user, isEdit = false) => {
    const newErrors = {};
    if (!user.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (user.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }
    if (!user.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.email)
    ) {
      newErrors.email = "Invalid email format";
    }
    if (!user.role?.trim()) {
      newErrors.role = "Role is required";
    } else if (!["admin", "editor", "viewer"].includes(user.role)) {
      newErrors.role = "Role must be admin, editor, or viewer";
    }
    if (!isEdit) {
      if (!user.password?.trim()) {
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
          newErrors.password = "Password must contain at least one uppercase letter";
        } else if (!hasLowerCase) {
          newErrors.password = "Password must contain at least one lowercase letter";
        } else if (!hasNumber) {
          newErrors.password = "Password must contain at least one number";
        } else if (!hasSpecialChar) {
          newErrors.password = "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const newFilters = { ...filters, search: searchInput.trim() };
      if (searchInput.trim() !== prevFiltersRef.current.search) {
        newFilters.page = 1;
      }
      if (
        JSON.stringify(newFilters) !== JSON.stringify(prevFiltersRef.current)
      ) {
        setFilters(newFilters);
        fetchUsers(newFilters);
        prevFiltersRef.current = newFilters;
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, fetchUsers, setFilters, filters]);

  const handleFilterChange = (key, selectedOption) => {
    const value = selectedOption?.value ?? selectedOption ?? "";
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchUsers(newFilters);
    prevFiltersRef.current = newFilters;
  };

  const handlePageChange = (event, page) => {
    console.log("Changing to page:", page);
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchUsers(newFilters);
    prevFiltersRef.current = newFilters;
  };

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
      fetchUsers(filters);
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

  const handleAddUser = async () => {
    if (!validateUser(newUser)) return;
    const result = await addUser(newUser);
    if (result?.success) {
      toast.success("User added successfully!");
      setShowAddModal(false);
      setNewUser({ name: "", email: "", role: "", password: "" });
      setErrors({});
      fetchUsers(filters);
    } else {
      toast.error(result?.message || "Failed to add user.");
    }
  };

const openConfirmDialog = (user, actionType) => {
  setSelectedUser(user);
  setConfirmAction(actionType);
  setConfirmMessage(
    actionType === "block"
      ? user.status === "deleted"
        ? "Are you sure you want to restore this user to active status?"
        : `Are you sure you want to ${
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
    fetchUsers(filters);
  };

  const handleToggleBlock = async (user) => {
  if (user.email === currentUser?.email) {
    toast.warning("You cannot block your own account!");
    return;
  }
  try {
    const result = await toggleBlock(user);
    if (result?.success) {
      fetchUsers(filters); // Refresh the user list
    } else {
      toast.error("Failed to update user status.");
    }
  } catch {
    toast.error("Something went wrong!");
  }
};

  const handleDelete = async (user) => {
    if (user.email === currentUser?.email) {
      toast.warning("You cannot delete your own account!");
      return;
    }
    try {
      const result = await deleteUser(user.id);
      if (result?.success) {
        toast.success("User deleted successfully!");
        fetchUsers(filters);
      } else {
        toast.error("Failed to delete user.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete user");
    }
  };

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

  return (
    <section className="content-section">
      <style>
        {`
          .skeleton-loader {
            animation: pulse 1.5s infinite;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            border-radius: 4px;
            height: 30px;
            width: 100%;
          }

          @keyframes pulse {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }

          .table-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #2563eb;
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
            display: block;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
              autoComplete="off"
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
              autoComplete="new-password"
            />
            {errors.password && (
              <small className="error-text">{errors.password}</small>
            )}
          </div>
        </div>
      </Dialog>
      <div className="crud-actions">
        <h1 className="section-title">User Management</h1>
        <div
          className="action-button"
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <InputText
            placeholder="Search by user name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ marginBottom: "10px", width: "200px" }}
          />
          <Dropdown
            value={filters.role}
            options={roleOptions}
            onChange={(e) => handleFilterChange("role", e.value)}
            placeholder="Select Role"
            style={{ marginBottom: "10px", width: "200px" }}
          />
          <Dropdown
            value={filters.status}
            options={statusOptions}
            onChange={(e) => handleFilterChange("status", e.value)}
            placeholder="Select Status"
            style={{ marginBottom: "10px", width: "200px" }}
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
            {loading ? (
              <>
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                    <div className="table-spinner"></div>
                    <p>Loading users...</p>
                  </td>
                </tr>
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    {[...Array(6)].map((_, cellIndex) => (
                      <td key={cellIndex}>
                        <div className="skeleton-loader"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
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
                    {editingRowId === u.id
                      ? u.status === "deleted"
                        ? "Deleted"
                        : u.status === "blocked"
                        ? "Blocked"
                        : "Active"
                      : u.status === "deleted"
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
  disabled={editingRowId === u.id || u.email === currentUser?.email}
>
  {u.status === "deleted" ? (
    <i className="pi pi-undo" />
  ) : u.status === "blocked" ? (
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
        {pagination.totalPages > 1 && (
          <Stack spacing={2} alignItems="center" sx={{ marginTop: "10px" }}>
            <Pagination
              count={pagination.totalPages}
              page={filters.page}
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

export default React.memo(UserManagement);