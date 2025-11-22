import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { Package, Store, Users, User,  Building } from "lucide-react";

interface DashboardStats {
  totalItems: number;
  totalFoodCourts: number;
  totalManagers: number;
  activeVendors: number;
}

interface FoodCourt {
  foodCourt: {
    name: string;
    location: string;
    isOpen: boolean;
  };
  itemCount: number;
}

interface ManagerDashboardData {
  foodCourts: FoodCourt[];
  vendor: {
    shopName: string;
  };
  managers: Array<{
    id: string;
    contactNo: string;
    isActive: boolean;
  }>;
  stats?: {
    totalOrders: number;
    totalRevenue: number;
    activeVendors: number;
    availableItems: number;
  };
}

const ManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await axiosInstance.get("/manager/dashboard");
        const data = response.data.data as ManagerDashboardData;

        setDashboardData(data);

        // Calculate stats from the dashboard data
        const totalFoodCourts = data.foodCourts.length;
        const totalManagers = data.managers.length;
        const totalItems = data.foodCourts.reduce((sum, fc) => sum + fc.itemCount, 0);
        const activeVendors = data.stats?.activeVendors || 1; // At least their vendor

        setStats({
          totalItems,
          totalFoodCourts,
          totalManagers,
          activeVendors
        });

      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          const responseData = err.response?.data as { message?: string } | undefined;
          setError(responseData?.message ?? err.message ?? "Failed to load dashboard data");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 max-w-md w-full">
          <div className="text-black font-bold text-lg mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-black text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Manager Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Managing {dashboardData?.vendor?.shopName || 'your vendor'}&apos;s operations.
          </p>
        </div>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Items Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-black">{stats.totalItems}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Food Courts Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Food Courts</p>
                  <p className="text-2xl font-bold text-black">{stats.totalFoodCourts}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Managers Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Team Managers</p>
                  <p className="text-2xl font-bold text-black">{stats?.totalManagers}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Active Vendors Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Vendors</p>
                  <p className="text-2xl font-bold text-black">{stats.activeVendors}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <h2 className="text-xl font-bold text-black mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="group flex items-center justify-center gap-2 bg-black text-white px-6 py-4 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-medium">
              <Package className="w-5 h-5" />
              Manage Items
            </button>
            <button className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-medium">
              <Store className="w-5 h-5" />
              View Food Court
            </button>
            <button className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-medium">
              <Users className="w-5 h-5" />
              Team Members
            </button>
            <button className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-medium">
              <User className="w-5 h-5" />
              View Profile
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Food Court Info */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">Assigned Food Court</h3>
            <div className="space-y-3">
              {dashboardData?.foodCourts.map((fc, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    fc.foodCourt.isOpen ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Building className={`w-5 h-5 ${fc.foodCourt.isOpen ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">{fc.foodCourt.name}</p>
                    <p className="text-xs text-gray-500">{fc.foodCourt.location}</p>
                    <p className="text-xs text-gray-500">{fc.itemCount} items available</p>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    fc.foodCourt.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {fc.foodCourt.isOpen ? 'Open' : 'Closed'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">Team Members</h3>
            <div className="space-y-3">
              {dashboardData?.managers.map((manager, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    manager.isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <User className={`w-5 h-5 ${manager.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">Manager {index + 1}</p>
                    <p className="text-xs text-gray-500">{manager.contactNo}</p>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    manager.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {manager.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
              {(!dashboardData?.managers || dashboardData.managers.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  No other team members found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;