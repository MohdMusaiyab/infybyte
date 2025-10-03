import React from "react";
import { Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => {
  return (
    <div>
      <aside style={{ width: "220px", float: "left", height: "100vh", background: "#f4f4f4", padding: "1rem" }}>
        <h2>Admin</h2>
        <nav>
          <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <a href="/admin/dashboard">Dashboard</a>
        </li>
        <li>
          <a href="/admin/all-users">All Users</a>
        </li>
        <li>
          <a href="/admin/profile">Profile</a>
        </li>
          </ul>
        </nav>
      </aside>
      <div style={{ marginLeft: "220px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "1rem", background: "#eaeaea" }}>
          <h1>Admin Dashboard</h1>
        </header>
        <main style={{ flex: 1, padding: "1rem" }}>
          <Outlet />
        </main>
        <footer style={{ padding: "1rem", background: "#eaeaea" }}>Admin Footer</footer>
      </div>
    </div>
  );
};

export default AdminLayout;
