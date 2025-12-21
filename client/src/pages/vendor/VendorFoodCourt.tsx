import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  Store,
  MapPin,
  Clock,
  ChevronRight,
  Loader,
  AlertCircle,
  LayoutGrid,
  CheckCircle2,
  Package,
} from "lucide-react";

// 1. Interfaces based on our Aggregation Pipeline
// Match these names to your Backend JSON exactly
interface FoodCourtStats {
  id: string; // mapped from _id in Go
  name: string;
  location: string;
  isOpen: boolean;
  timings?: string;
  totalItems: number; // Change from itemCount to totalItems
  activeItems: number; // Change from activeCount to activeItems
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: FoodCourtStats[];
}

const VendorFoodCourts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [foodCourts, setFoodCourts] = useState<FoodCourtStats[]>([]);

  // 2. Fetch Data
  const fetchMyFoodCourts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get<ApiResponse>(
        "/vendor/my-foodcourts"
      );
      setFoodCourts(response.data.data || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch locations");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyFoodCourts();
  }, [fetchMyFoodCourts]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader className="w-10 h-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black flex items-center gap-3">
          <Store className="w-8 h-8" />
          My Food Court Locations
        </h1>
        <p className="text-gray-500 mt-2">
          Manage your menu and availability across all registered locations.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Total Locations</p>
          <p className="text-3xl font-bold mt-1">{foodCourts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Active Menu Items</p>
          <p className="text-3xl font-bold mt-1 text-green-600">
            {foodCourts.reduce((acc, curr) => acc + curr.activeItems, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Open Now</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">
            {foodCourts.filter((fc) => fc.isOpen).length}
          </p>
        </div>
      </div>

      {/* Grid of Food Courts */}
      {foodCourts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">
            No Locations Found
          </h3>
          <p className="text-gray-500">
            You haven't been assigned to any food courts yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foodCourts.map((fc) => (
            <div
              key={fc.id}
              onClick={() => navigate(`/vendor/foodcourt/${fc.id}/items`)}
              className="group bg-white border-2 border-gray-100 rounded-3xl p-6 hover:border-black transition-all cursor-pointer hover:shadow-xl relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    fc.isOpen
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      fc.isOpen ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {fc.isOpen ? "OPEN" : "CLOSED"}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>

              <h2 className="text-xl font-bold text-black mb-1">{fc.name}</h2>
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-6">
                <MapPin className="w-3.5 h-3.5" />
                {fc.location}
              </div>

              {/* Stats Row */}
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    Total Items
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-bold">{fc.totalItems}</span>{" "}
                    {/* Updated name */}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    Active Items
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-green-600">
                      {fc.activeItems}
                    </span>{" "}
                    {/* Updated name */}
                  </div>
                </div>
              </div>

              {fc.timings && (
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {fc.timings}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorFoodCourts;
