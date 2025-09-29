import React from "react";
import { Outlet } from "react-router-dom";

const VendorLayout: React.FC = () => {
  return (
    <div>
      <header>
        <h1>Vendor Panel</h1>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>Vendor Footer</footer>
    </div>
  );
};

export default VendorLayout;
