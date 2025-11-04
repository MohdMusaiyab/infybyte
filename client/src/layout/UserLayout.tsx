import React from "react";
import { Outlet } from "react-router-dom";

const UserLayout: React.FC = () => {
  return (
    <div>
      <main>
        <Outlet />
      </main>
      <footer>User Footer</footer>
    </div>
  );
};

export default UserLayout;
