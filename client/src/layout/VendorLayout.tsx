import React from "react";
import { Outlet } from "react-router-dom";

const VendorLayout: React.FC = () => {
  return (
    <div>
      <header>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>Vendor Footer</footer>
    </div>
  );
};

export default VendorLayout;
