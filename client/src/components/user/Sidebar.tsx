import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LogOut, Menu, X, MapPin, ChevronRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import ConfirmModal from "../general/ConfirmModel";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/user/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Home",
      path: "/",
      icon: Home,
      exact: true,
    },
  ];

  const handleLogout = () => {
    
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setShowLogoutModal(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const NavItem: React.FC<{
    item: (typeof menuItems)[0];
    onItemClick: () => void;
  }> = ({ item, onItemClick }) => {
    const active = isActive(item.path, item.exact);

    return (
      <Link
        to={item.path}
        onClick={onItemClick}
        className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
          active
            ? "bg-black text-white shadow-lg"
            : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
        }`}
      >
        <item.icon
          className={`w-5 h-5 ${active ? "text-white" : "text-gray-500"}`}
        />
        <span className="font-medium">{item.name}</span>

        {!active && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-black rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </Link>
    );
  };

  return (
    <>
      {isMobile && (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">Infybite</h1>
              <p className="text-xs text-gray-500">Food Explorer</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>
      )}

      {isMobile && isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${
          isMobile
            ? isOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        }
        ${isMobile ? "mt-16" : ""}
      `}
      >
        {!isMobile && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Infybite</h1>
                <p className="text-sm text-gray-500">Food Explorer</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                onItemClick={() => isMobile && setIsOpen(false)}
              />
            ))}
          </div>
        </nav>

        <div className="p-6 border-t border-gray-200 space-y-2">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 mt-4"
          >
            <LogOut className={`w-5 h-5 ${isLoading ? "animate-pulse" : ""}`} />
            <span className="font-medium">
              {isLoading ? "Logging out..." : "Logout"}
            </span>
          </button>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link to="/user/profile">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {user?.name || "User Name"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || "useremail@gmail.com"}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          </div>
        </div>
      </aside>

      
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout Confirmation"
        message="Are you sure you want to log out? You'll need to sign in again to access your dashboard."
        confirmText="Logout"
        cancelText="Stay Logged In"
        isLoading={isLoading}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
};

export default Sidebar;