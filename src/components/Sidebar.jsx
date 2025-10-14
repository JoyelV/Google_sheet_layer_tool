import React from "react";

const Sidebar = ({ activeTab, setActiveTab, role }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Admin Dashboard</h2>
      </div>
      <nav>
        <ul>
          {/* Vehicle Management tab - available to all */}
          <li
            className={activeTab === "data" ? "active" : ""}
            onClick={() => setActiveTab("data")}
          >
            <i className="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-database h-4 w-4"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                <path d="M3 12A9 3 0 0 0 21 12"></path>
              </svg>
            </i>
            Vehicle Management
          </li>

          {/* User Management tab - only for admin */}
          {role === "admin" && (
            <li
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              <i className="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-user h-4 w-4"
                >
                  <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </i>
              User Management
            </li>
          )}

          {/* Profile Page - available to all */}
          <li
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            <i className="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-user-check h-4 w-4"
              >
                <circle cx="12" cy="7" r="4" />
                <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
                <path d="M9 11l2 2 4-4" />
              </svg>
            </i>
            Profile
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
