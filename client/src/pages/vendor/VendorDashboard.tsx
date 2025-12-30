import React, { useState, useEffect } from "react";
import { AxiosError } from "axios";
import axiosInstance from "../../utils/axiosInstance";
import {
  Package,
  Users,
  Store,
  Zap,
  Clock,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardStats {
  vendorName: string;
  totalStats: {
    totalItems: number;
    totalManagers: number;
    totalFoodCourts: number;
    totalFoodCourtItems: number;
    activeItems: number;
    availableItems: number;
  };
  foodCourts: Array<{
    id: string;
    name: string;
    itemCount: number;
  }>;
  recentUpdates: Array<{
    itemName: string;
    foodCourtName: string;
    status: string;
    updatedAt: string;
  }>;
}

const VendorDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDashboardStats = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);
    setError("");

    try {
      const response = await axiosInstance.get("/vendor/dashboard");
      setStats(response.data.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ??
            err.message ??
            "Failed to load dashboard data"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600 bg-green-100";
      case "sellingfast":
        return "text-orange-600 bg-orange-100";
      case "finishingsoon":
        return "text-yellow-600 bg-yellow-100";
      case "notavailable":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {[...Array(6)]?.map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200"
                >
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                  {[...Array(3)]?.map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-3">
                  {[...Array(5)]?.map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => fetchDashboardStats()}
                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">
              {stats?.vendorName
                ? `${stats.vendorName} Dashboard`
                : "Vendor Dashboard"}
            </h1>
            <p className="text-gray-600">
              Overview of your restaurant's performance
            </p>
          </div>
          <button
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white text-black px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-black transition-all duration-300 font-medium disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Items</div>
                <div className="text-2xl font-bold text-black">
                  {stats?.totalStats.totalItems || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Managers</div>
                <div className="text-2xl font-bold text-black">
                  {stats?.totalStats.totalManagers || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Food Courts</div>
                <div className="text-2xl font-bold text-black">
                  {stats?.totalStats.totalFoodCourts || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Items in Courts</div>
                <div className="text-2xl font-bold text-black">
                  {stats?.totalStats.totalFoodCourtItems || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Active Items</div>
                <div className="text-2xl font-bold text-black">
                  {stats?.totalStats.activeItems || 0}
                  <span className="text-sm text-green-600 ml-2">
                    (
                    {stats?.totalStats.activeItems &&
                    stats?.totalStats.totalFoodCourtItems
                      ? Math.round(
                          (stats.totalStats.activeItems /
                            stats.totalStats.totalFoodCourtItems) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Available Now</div>
                <div className="text-2xl font-bold text-black">
                  {stats?.totalStats.availableItems || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black">Food Courts</h2>
                <div className="text-sm text-gray-600">
                  {stats?.foodCourts?.length || 0} locations
                </div>
              </div>

              {stats?.foodCourts && stats.foodCourts?.length > 0 ? (
                <div className="space-y-4">
                  {stats.foodCourts?.map((foodCourt) => (
                    <div
                      key={foodCourt.id}
                      className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-black transition-colors duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors duration-200">
                          <Store className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-200" />
                        </div>
                        <div>
                          <Link to={`/vendor/foodcourt/${foodCourt.id}/items`}>
                            <h3 className="font-bold text-black text-lg">
                              {foodCourt.name}
                            </h3>
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-black">
                            {foodCourt.itemCount}
                          </div>
                          <div className="text-sm text-gray-600">items</div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors duration-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-black mb-2">
                    No Food Courts
                  </h3>
                  <p className="text-gray-600">
                    You are not part of any food courts yet
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black">Recent Updates</h2>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>

              {stats?.recentUpdates && stats.recentUpdates?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentUpdates?.map((update, index) => (
                    <div
                      key={index}
                      className="p-3 border-2 border-gray-200 rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600">
                            {update.foodCourtName}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            update.status
                          )}`}
                        >
                          {update.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(update.updatedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-black mb-2">
                    No Recent Activity
                  </h3>
                  <p className="text-gray-600">Updates will appear here</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mt-6">
              <h2 className="text-xl font-bold text-black mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-black hover:bg-gray-100 rounded-xl transition-colors duration-200 text-left">
                  <Package className="w-5 h-5" />
                  <Link to={`/vendor/items/create`}>
                    <span className="font-medium">Add New Item</span>
                  </Link>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-black hover:bg-gray-100 rounded-xl transition-colors duration-200 text-left">
                  <Store className="w-5 h-5" />
                  <Link to={`/vendor/foodcourt`}>
                    <span className="font-medium">View Your Food Courts</span>
                  </Link>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-black hover:bg-gray-100 rounded-xl transition-colors duration-200 text-left">
                  <Users className="w-5 h-5" />
                  <Link to={`/vendor/managers`}>
                    <span className="font-medium">View Managers</span>
                  </Link>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
