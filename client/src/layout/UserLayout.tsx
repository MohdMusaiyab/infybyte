import React from "react";
import { Outlet } from "react-router-dom";

const UserLayout: React.FC = () => {
  return (
    <div>
      <header>
        <h1>User Dashboard</h1>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>User Footer</footer>
    </div>
  );
};

export default UserLayout;
