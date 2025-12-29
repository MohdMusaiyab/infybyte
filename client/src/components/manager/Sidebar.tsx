import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  Menu,
  X,
  Building,
  Utensils,
  ChevronRight,
  HomeIcon,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/manager/dashboard", icon: Home, exact: false },
    { name: "Home", path: "/", icon: HomeIcon, exact: true },
    { name: "View Your FoodCourts", path: "/manager/food-courts", icon: HomeIcon, exact: true },
    { name: "Item Management", path: "/manager/item-management", icon: Utensils, exact: false },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const confirmLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const NavItem: React.FC<{ item: typeof menuItems[0]; onItemClick: () => void }> = ({
    item,
    onItemClick,
  }) => {
    const active = isActive(item.path, item.exact);
    return (
      <Link
        to={item.path}
        onClick={onItemClick}
        className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
          active ? "bg-black text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <item.icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-500"}`} />
        <span className="font-medium">{item.name}</span>
        {!active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-black rounded-r opacity-0 group-hover:opacity-100 transition-all" />
        )}
      </Link>
    );
  };

  return (
    <>
     
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirm Logout</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to log out of your management session?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      
      {isMobile && (
        <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-100 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center"><Building className="w-5 h-5 text-white" /></div>
            <h1 className="font-bold text-black">Manager Portal</h1>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-50 rounded-lg">
            {isOpen ? <X /> : <Menu />}
          </button>
        </header>
      )}

      
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setIsOpen(false)} />}

      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${isMobile ? (isOpen ? "translate-x-0 mt-16" : "-translate-x-full mt-16") : "translate-x-0"}`}>
        
      
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black leading-tight">Food Court</h1>
              <p className="text-xs text-gray-400 font-medium">MANAGER ACCESS</p>
            </div>
          </div>
        </div>

        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-2">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} onItemClick={() => isMobile && setIsOpen(false)} />
          ))}
        </nav>

        
        <div className="p-4 border-t border-gray-100 space-y-2">
        
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>

          
          <Link to="/manager/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-black truncate">{user?.name || "Manager Name"}</p>
              <p className="text-[10px] text-gray-400 truncate uppercase tracking-wider">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;