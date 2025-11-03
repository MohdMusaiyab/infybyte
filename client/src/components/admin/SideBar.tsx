import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  BarChart3,
  Shield
} from 'lucide-react';

const SideBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: Home,
      exact: true
    },
    { 
      name: 'Users', 
      path: '/admin/users',
      icon: Users,
      children: [
        { name: 'All Users', path: '/admin/all-users' },
        { name: 'User Roles', path: '/admin/user-roles' },
        { name: 'Activity Log', path: '/admin/activity-log' }
      ]
    },
    { 
      name: 'Profile', 
      path: '/admin/profile', 
      icon: User 
    },
    { 
      name: 'Analytics', 
      path: '/admin/analytics', 
      icon: BarChart3 
    },
    { 
      name: 'Security', 
      path: '/admin/security', 
      icon: Shield 
    },
    { 
      name: 'Settings', 
      path: '/admin/settings', 
      icon: Settings 
    },
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
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path, item.exact);

    if (hasChildren) {
      return (
        <div className="mb-2">
          <button
            onClick={() => setIsUsersOpen(!isUsersOpen)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
              active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${
                isUsersOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {isUsersOpen && (
            <div className="ml-4 mt-2 space-y-1">
              {item.children!.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={onItemClick}
                  className={`block p-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive(child.path) 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.path}
        onClick={onItemClick}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 mb-2 ${
          active 
            ? 'bg-black text-white shadow-lg' 
            : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
        }`}
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Floating Action Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 p-4 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 hover:scale-110 transition-all duration-200 active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">Admin Panel</h1>
              <p className="text-sm text-gray-500">Administrator</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavItem 
                key={item.path} 
                item={item} 
                onItemClick={() => setIsOpen(false)}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              v1.0.0 • Infybite Admin
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideBar;