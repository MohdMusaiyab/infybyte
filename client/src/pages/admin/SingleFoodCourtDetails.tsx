"use client";
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import axios from "axios";
import {
  Store,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  Save,
  Trash2,
  Plus,
  UserPlus,
  ArrowLeft,
  Users,
} from "lucide-react";

interface Vendor {
  _id: string;
  shopName: string;
}

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  timings?: string;
  weekdays: boolean;
  weekends: boolean;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  foodCourt: FoodCourt;
  vendors: Vendor[];
}

const SingleFoodCourtDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    timings: "",
    weekdays: true,
    weekends: true,
    isOpen: true,
  });

  const fetchFoodCourt = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(
        `/admin/get-food-court-details/${id}`
      );
      const data: ApiResponse = res.data.data;
      setFoodCourt(data.foodCourt);
      setVendors(data.vendors || []);
      setEditForm({
        name: data.foodCourt.name,
        location: data.foodCourt.location,
        timings: data.foodCourt.timings || "",
        weekdays: data.foodCourt.weekdays,
        weekends: data.foodCourt.weekends,
        isOpen: data.foodCourt.isOpen,
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.message ??
          err.message ??
          "Failed to fetch food court details.";
        setError(msg);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVendors = async () => {
    try {
      const res = await axiosInstance.get("/admin/vendor-dropdown");
      const raw: unknown[] = res.data.data || [];
      const mapped: Vendor[] = raw.map((r) => {
        const obj = r as {
          _id?: string;
          id?: string;
          shopName?: string;
          shop_name?: string;
          name?: string;
        };
        return {
          _id: obj._id ?? obj.id ?? String(r),
          shopName: obj.shopName ?? obj.shop_name ?? obj.name ?? String(r),
        };
      });
      setAvailableVendors(mapped);
    } catch {
      console.error("Failed to fetch available vendors");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    setSuccess("");
    try {
      await axiosInstance.put(`/admin/food-courts/${id}`, editForm);
      setSuccess("Food court updated successfully!");
      fetchFoodCourt();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to update food court");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    }
  };

  const handleAddVendor = async () => {
    if (!id || !selectedVendor) return;
    setError("");
    setSuccess("");
    try {
      await axiosInstance.post(
        `/admin/food-courts/${id}/add-vendor/${selectedVendor}`
      );
      setSuccess("Vendor added successfully!");
      setSelectedVendor("");
      fetchFoodCourt();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "Failed to add vendor.";
        setError(msg);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while adding vendor.");
      }
    }
  };

  const handleRemoveVendor = async (vendorId: string) => {
    if (!id || !vendorId) return;
    const confirmRemove = confirm(
      "Are you sure you want to remove this vendor?"
    );
    if (!confirmRemove) return;

    setError("");
    setSuccess("");
    try {
      await axiosInstance.delete(
        `/admin/food-courts/${id}/remove-vendor/${vendorId}`
      );
      setSuccess("Vendor removed successfully!");
      fetchFoodCourt();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "Failed to remove vendor.";
        setError(msg);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while removing vendor.");
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this food court?")) return;
    try {
      await axiosInstance.delete(`/admin/food-courts/${id}`);
      navigate("/admin/food-courts");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to delete food court");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    }
  };

  useEffect(() => {
    fetchFoodCourt();
    fetchAvailableVendors();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading food court details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !foodCourt) {
    return (
      <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
        <button
          onClick={() => navigate("/admin/food-courts")}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Food Courts
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-white" />
          </div>
          <p className="text-red-700 text-sm md:text-base break-words">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!foodCourt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No food court found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
      <button
        onClick={() => navigate("/admin/food-courts")}
        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Food Courts</span>
        <span className="sm:hidden">Back</span>
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
            {foodCourt.name}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Food court details and management
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-xs md:text-sm break-words">
            {success}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-white" />
          </div>
          <p className="text-red-700 text-xs md:text-sm break-words">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
          Food Court Information
        </h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Food Court Name
            </label>
            <input
              type="text"
              name="name"
              value={editForm.name}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={editForm.location}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              Timings (Optional)
            </label>
            <input
              type="text"
              name="timings"
              value={editForm.timings}
              onChange={handleChange}
              placeholder="e.g., 9:00 AM - 10:00 PM"
              className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

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
                  checked={editForm.weekdays}
                  onChange={handleChange}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm md:text-base text-gray-700">
                  Weekdays
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="weekends"
                  checked={editForm.weekends}
                  onChange={handleChange}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm md:text-base text-gray-700">
                  Weekends
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isOpen"
                  checked={editForm.isOpen}
                  onChange={handleChange}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm md:text-base text-gray-700">
                  Currently Open
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm md:text-base"
          >
            <Save className="w-4 h-4" />
            Update Food Court
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-black" />
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Assigned Vendors ({vendors.length})
          </h2>
        </div>

        {vendors.length > 0 ? (
          <div className="space-y-3 mb-6">
            {vendors.map((vendor) => (
              <div
                key={vendor._id}
                className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-md transition-all"
              >
                <Link
                  to={`/vendor/${vendor._id}`}
                  className="flex-1 text-base md:text-lg font-semibold text-black hover:text-gray-700 transition-colors break-words"
                >
                  {vendor.shopName}
                </Link>
                <button
                  onClick={() => handleRemoveVendor(vendor._id)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm border border-red-200 hover:border-red-300"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No vendors assigned yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add vendors below to get started
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200">
          <label className="flex items-center gap-2 text-sm md:text-base font-medium text-gray-700 mb-3">
            <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
            Add New Vendor
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            >
              <option value="">Select a vendor...</option>
              {availableVendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.shopName}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddVendor}
              disabled={!selectedVendor}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 md:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium text-sm md:text-base"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              <Calendar className="w-4 h-4" />
              Created At
            </label>
            <p className="text-xs md:text-sm text-gray-700 break-words">
              {new Date(foodCourt.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              <Clock className="w-4 h-4" />
              Last Updated
            </label>
            <p className="text-xs md:text-sm text-gray-700 break-words">
              {new Date(foodCourt.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium text-sm md:text-base"
        >
          <Trash2 className="w-4 h-4" />
          Delete Food Court
        </button>
      </div>
    </div>
  );
};

export default SingleFoodCourtDetails;
