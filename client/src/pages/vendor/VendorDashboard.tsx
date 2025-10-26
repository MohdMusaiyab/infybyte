import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";

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
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-600 mt-2">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vendor Dashboard</h1>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Items Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalItems}</p>
                </div>
              </div>
            </div>

            {/* Food Courts Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Food Courts</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalFoodCourts}</p>
                </div>
              </div>
            </div>

            {/* Managers Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Managers</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalManagers}</p>
                </div>
              </div>
            </div>

            {/* Active Items Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeFoodCourtItems}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add New Item
            </button>
            <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Manage Food Courts
            </button>
            <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Add Manager
            </button>
            <button className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;