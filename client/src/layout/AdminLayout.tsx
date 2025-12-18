import React from "react";
import { Outlet } from "react-router-dom";
import SideBar from "../components/admin/SideBar";

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SideBar />

        <div className="flex-1 lg:ml-0 min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200 lg:sticky lg:top-0 z-20"></header>

          <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
            <Outlet />
          </main>

          <footer className="bg-white border-t border-gray-200 py-4 px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">
                © 2025 Infybite Admin. All rights reserved.
              </p>
              <div className="flex gap-4 mt-2 sm:mt-0">
                <a
                  href="#"
                  className="text-gray-500 hover:text-black text-sm transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-black text-sm transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-black text-sm transition-colors"
                >
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

export default AdminLayout;
