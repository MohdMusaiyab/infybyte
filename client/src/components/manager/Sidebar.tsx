import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  BarChart3, 
  Settings, 
  Users, 
  Bell, 
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChefHat,
  DollarSign,
  Star,
  Building,
  Utensils,
  UserCheck
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/manager/dashboard',
      icon: Home,
      exact: true
    },
    {
      name: 'Orders',
      path: '/manager/orders',
      icon: Package,
      badge: '8'
    },
    {
      name: 'Vendor Management',
      path: '/manager/vendors',
      icon: ChefHat
    },
    {
      name: 'Menu Oversight',
      path: '/manager/menu',
      icon: Utensils
    },
    {
      name: 'Food Court Analytics',
      path: '/manager/analytics',
      icon: BarChart3
    },
    {
      name: 'Customer Management',
      path: '/manager/customers',
      icon: Users
    },
    {
      name: 'Staff Management',
      path: '/manager/staff',
      icon: UserCheck
    },
    {
      name: 'Reviews & Ratings',
      path: '/manager/reviews',
      icon: Star
    },
    {
      name: 'Messages',
      path: '/manager/messages',
      icon: MessageSquare,
      badge: '2'
    }
  ];

  const bottomMenuItems = [
    {
      name: 'Notifications',
      path: '/manager/notifications',
      icon: Bell,
      badge: '3'
    },
    {
      name: 'Settings',
      path: '/manager/settings',
      icon: Settings
    }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const NavItem: React.FC<{
    item: typeof menuItems[0];
    onItemClick: () => void;
  }> = ({ item, onItemClick }) => {
    const active = isActive(item.path, item.exact);
    
    return (
      <Link
        to={item.path}
        onClick={onItemClick}
        className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
          active 
            ? 'bg-black text-white shadow-lg' 
            : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
        }`}
      >
        <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
        <span className="font-medium">{item.name}</span>
        
        {item.badge && (
          <span className={`absolute right-3 px-2 py-1 text-xs rounded-full ${
            active 
              ? 'bg-white text-black' 
              : 'bg-black text-white'
          }`}>
            {item.badge}
          </span>
        )}
        
        {/* Hover indicator */}
        {!active && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-black rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header with Hamburger */}
      {isMobile && (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black">Food Court Manager</h1>
              <p className="text-xs text-gray-500">Management Portal</p>
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

      {/* Overlay */}
      {isMobile && isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        ${isMobile ? 'mt-16' : ''}
      `}>
        
        {/* Desktop Header */}
        {!isMobile && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                <Building className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Food Court Manager</h1>
                <p className="text-sm text-gray-500">Management Portal</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-600">Vendors</span>
                </div>
                <p className="text-sm font-semibold text-black">12 Active</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-600">Today</span>
                </div>
                <p className="text-sm font-semibold text-black">₹15,632</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
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

        {/* Bottom Section */}
        <div className="p-6 border-t border-gray-200 space-y-2">
          {bottomMenuItems.map((item) => (
            <NavItem 
              key={item.path} 
              item={item} 
              onItemClick={() => isMobile && setIsOpen(false)}
            />
          ))}
          
          {/* Logout Button */}
          <button className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 mt-4">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
          
          {/* User Profile */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <img 
                src="/api/placeholder/40/40" 
                alt="Profile" 
                className="w-10 h-10 rounded-full bg-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">Manager Name</p>
                <p className="text-xs text-gray-500 truncate">manager@foodcourt.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;