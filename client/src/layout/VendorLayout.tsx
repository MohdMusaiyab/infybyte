import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/vendor/Sidebar";

const VendorLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0 min-h-screen flex flex-col">
          {/* Mobile spacing - only on mobile */}
          <div className="lg:hidden h-16"></div>
          
          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
          
          <footer className="bg-white border-t border-gray-200 py-4 px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">
                © 2024 Infybite Vendor. All rights reserved.
              </p>
              <div className="flex gap-4 mt-2 sm:mt-0">
                <span className="text-gray-500 text-sm">v1.0.0</span>
                <a href="#" className="text-gray-500 hover:text-black text-sm transition-colors">
                  Support
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default VendorLayout;