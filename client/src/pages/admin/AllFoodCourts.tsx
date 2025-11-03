"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import type { FoodCourt } from "../../types/auth";
import axios from "axios";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle2,
  XCircle,
  Store,
  X
} from "lucide-react";

const AllFoodCourts = () => {
  const [foodCourts, setFoodCourts] = useState<FoodCourt[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    timings: "",
    weekdays: true,
    weekends: true,
    isOpen: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all food courts
  const fetchFoodCourts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/my-food-courts");
      setFoodCourts(res.data.data.foodcourts);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to fetch food courts."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodCourts();
  }, []);

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axiosInstance.post("/admin/food-courts", formData);
      setSuccess("Food court created successfully!");
      setFormData({
        name: "",
        location: "",
        timings: "",
        weekdays: true,
        weekends: true,
        isOpen: true,
      });
      fetchFoodCourts();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to create food court.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
      {/* Header Section */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
            Food Courts
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage all food court locations
          </p>
        </div>
      </div>

      {/* Create Food Court Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Plus className="w-5 h-5 md:w-6 md:h-6 text-black" />
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Create New Food Court
          </h2>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-xs md:text-sm break-words">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <X className="w-3 h-3 text-white" />
            </div>
            <p className="text-red-700 text-xs md:text-sm break-words">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Food Court Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter food court name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Location Input */}
          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Location *
            </label>
            <input
              type="text"
              name="location"
              placeholder="Enter location address"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Timings Input */}
          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              Timings (Optional)
            </label>
            <input
              type="text"
              name="timings"
              placeholder="e.g., 9:00 AM - 10:00 PM"
              value={formData.timings}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              Availability
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="weekdays"
                  checked={formData.weekdays}
                  onChange={handleChange}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm md:text-base text-gray-700">Weekdays</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="weekends"
                  checked={formData.weekends}
                  onChange={handleChange}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm md:text-base text-gray-700">Weekends</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isOpen"
                  checked={formData.isOpen}
                  onChange={handleChange}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm md:text-base text-gray-700">Currently Open</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Create Food Court
          </button>
        </form>
      </div>

      {/* Food Courts List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
          All Food Courts ({foodCourts.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-500">Loading food courts...</p>
          </div>
        ) : foodCourts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No food courts found</p>
            <p className="text-sm text-gray-500 mt-1">Create your first food court above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {foodCourts.map((fc) => (
              <div
                key={fc.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 break-words mb-2">
                      {fc.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs md:text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{fc.location}</span>
                      </div>
                      
                      {fc.timings && (
                        <div className="flex items-start gap-2 text-xs md:text-sm text-gray-600">
                          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{fc.timings}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {fc.weekdays && (
                      <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs md:text-sm font-medium">
                        <Calendar className="w-3 h-3" />
                        Weekdays
                      </span>
                    )}
                    {fc.weekends && (
                      <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs md:text-sm font-medium">
                        <Calendar className="w-3 h-3" />
                        Weekends
                      </span>
                    )}
                    {fc.isOpen ? (
                      <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs md:text-sm font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-red-100 text-red-800 rounded-lg text-xs md:text-sm font-medium">
                        <XCircle className="w-3 h-3" />
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllFoodCourts;