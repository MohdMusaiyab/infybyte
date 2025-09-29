import React from "react";
import { Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => {
  return (
    <div>
      <header>
        <h1>Admin Dashboard</h1>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>Admin Footer</footer>
    </div>
  );
};

export default AdminLayout;
