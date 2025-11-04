import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { Package, Store, Users, Zap, Plus, Settings, User, ChefHat } from "lucide-react";

interface DashboardStats {
  totalItems: number;
  totalFoodCourts: number;
  totalManagers: number;
  activeFoodCourtItems: number;
}

interface FoodCourtItem {
  isActive: boolean;
}

interface ProfileData {
  foodCourtItems?: FoodCourtItem[];
}

const VendorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [profileResponse, itemsResponse, foodCourtsResponse, managersResponse] = await Promise.all([
          axiosInstance.get("/vendor/profile"),
          axiosInstance.get("/vendor/items"),
          axiosInstance.get("/vendor/foodcourts"),
          axiosInstance.get("/vendor/managers")
        ]);

        const profileData = profileResponse.data.data as ProfileData;
        const items = itemsResponse.data.data || [];
        const foodCourts = foodCourtsResponse.data.data || [];
        const managers = managersResponse.data.data || [];

        const activeFoodCourtItems = profileData.foodCourtItems?.filter((item: FoodCourtItem) => item.isActive)?.length || 0;

        setStats({
          totalItems: items.length,
          totalFoodCourts: foodCourts.length,
          totalManagers: managers.length,
          activeFoodCourtItems
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
          <h1 className="text-3xl font-bold text-black mb-2">Vendor Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your business overview.</p>
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Managers</p>
                  <p className="text-2xl font-bold text-black">{stats.totalManagers}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Active Items Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Items</p>
                  <p className="text-2xl font-bold text-black">{stats.activeFoodCourtItems}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
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
              <Plus className="w-5 h-5" />
              Add New Item
            </button>
            <button className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-medium">
              <Store className="w-5 h-5" />
              Manage Food Courts
            </button>
            <button className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-medium">
              <Users className="w-5 h-5" />
              Add Manager
            </button>
            <button className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-medium">
              <User className="w-5 h-5" />
              View Profile
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { action: "New order received", time: "2 min ago", type: "order" },
                { action: "Menu item updated", time: "5 min ago", type: "update" },
                { action: "New review received", time: "10 min ago", type: "review" },
                { action: "Stock running low", time: "15 min ago", type: "alert" }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === 'order' ? 'bg-green-100' : 
                    activity.type === 'update' ? 'bg-blue-100' : 
                    activity.type === 'review' ? 'bg-purple-100' : 'bg-orange-100'
                  }`}>
                    {activity.type === 'order' && <Package className="w-5 h-5 text-green-600" />}
                    {activity.type === 'update' && <Settings className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'review' && <ChefHat className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'alert' && <Zap className="w-5 h-5 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">Performance</h3>
            <div className="space-y-4">
              {[
                { metric: "Order Completion", value: "98%", trend: "up" },
                { metric: "Customer Rating", value: "4.8/5", trend: "up" },
                { metric: "Response Time", value: "5 min", trend: "down" },
                { metric: "Stock Availability", value: "92%", trend: "up" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-700">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-black">{item.value}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {item.trend === 'up' ? '↑' : '↓'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;