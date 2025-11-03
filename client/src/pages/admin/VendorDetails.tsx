import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import axios from "axios";
import type { ApiResponse } from "../../types/auth";
import { 
  ArrowLeft, 
  Store, 
  Calendar, 
  Hash, 
  Package, 
  Shield,
  Edit,
  Eye,
  X
} from "lucide-react";

interface VendorDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  shopName: string;
  vendorId: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

const VendorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!id) {
        setError("Vendor ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<ApiResponse<VendorDetails>>(
          `/admin/vendors/${id}`
        );
        setVendor(response.data.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const responseData = err.response?.data as
            | { message?: string }
            | undefined;
          setError(
            responseData?.message ??
              err.message ??
              "Failed to fetch vendor details."
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

    fetchVendorDetails();
  }, [id]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
        <button
          onClick={() => navigate("/admin/vendors")}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendors
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-white" />
          </div>
          <p className="text-red-700 text-sm md:text-base break-words">
            {error || "Vendor not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/vendors")}
        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Vendors</span>
        <span className="sm:hidden">Back</span>
      </button>

      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
            <Store className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
              {vendor.name}
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1 break-all">
              {vendor.email}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-purple-100 text-purple-800 rounded-xl w-fit font-semibold text-sm md:text-base">
          <Shield className="w-4 h-4" />
          {vendor.role.toUpperCase()}
        </div>
      </div>

      {/* Main Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
          Vendor Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Shop Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              <Store className="w-4 h-4" />
              Shop Name
            </label>
            <p className="text-base md:text-lg font-semibold text-gray-900 break-words">
              {vendor.shopName}
            </p>
          </div>

          {/* Total Items */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              <Package className="w-4 h-4" />
              Total Items
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-black">
                {vendor.itemCount}
              </span>
              <span className="text-sm md:text-base text-gray-600">items listed</span>
            </div>
          </div>

          {/* Vendor ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              <Hash className="w-4 h-4" />
              Vendor ID
            </label>
            <p className="text-xs md:text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 break-all">
              {vendor.vendorId}
            </p>
          </div>

          {/* User ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              <Hash className="w-4 h-4" />
              User ID
            </label>
            <p className="text-xs md:text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 break-all">
              {vendor.id}
            </p>
          </div>

          {/* Created At */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              Account Created
            </label>
            <p className="text-sm md:text-base text-gray-700 break-words">
              {formatDate(vendor.createdAt)}
            </p>
          </div>

          {/* Updated At */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              Last Updated
            </label>
            <p className="text-sm md:text-base text-gray-700 break-words">
              {formatDate(vendor.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-black to-gray-800 rounded-xl p-4 md:p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm text-gray-300 font-medium mb-1">
                Total Items Listed
              </div>
              <div className="text-2xl md:text-3xl font-bold break-words">
                {vendor.itemCount}
              </div>
            </div>
          </div>
          <div className="text-xs md:text-sm text-gray-300">
            Active products in store
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 md:p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm text-purple-200 font-medium mb-1">
                Account Role
              </div>
              <div className="text-2xl md:text-3xl font-bold uppercase break-words">
                {vendor.role}
              </div>
            </div>
          </div>
          <div className="text-xs md:text-sm text-purple-200">
            Access level permission
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/admin/vendors/${vendor.id}/items`)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-sm hover:shadow-md text-sm md:text-base"
        >
          <Eye className="w-4 h-4 md:w-5 md:h-5" />
          View Items
        </button>
        <button
          onClick={() => navigate(`/admin/vendors/${vendor.id}/edit`)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm md:text-base"
        >
          <Edit className="w-4 h-4 md:w-5 md:h-5" />
          Edit Vendor
        </button>
      </div>
    </div>
  );
};

export default VendorDetails;