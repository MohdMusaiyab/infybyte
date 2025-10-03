import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import axios from "axios";
import type { ApiResponse } from "../../types/auth";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading vendor details...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/vendors")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Vendors
          </button>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error || "Vendor not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/vendors")}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Vendors
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Vendor Details</h1>
        <p className="text-gray-600 mt-2">
          Complete information about this vendor
        </p>
      </div>

      {/* Vendor Information Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {vendor.name}
            </h2>
            <p className="text-gray-600 mt-1">{vendor.email}</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {vendor.role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Shop Name
              </label>
              <p className="text-lg text-gray-900">{vendor.shopName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Vendor ID
              </label>
              <p className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded">
                {vendor.vendorId}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                User ID
              </label>
              <p className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded">
                {vendor.id}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Total Items
              </label>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-blue-600">
                  {vendor.itemCount}
                </span>
                <span className="ml-2 text-gray-600">items listed</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Account Created
              </label>
              <p className="text-sm text-gray-700">
                {formatDate(vendor.createdAt)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Last Updated
              </label>
              <p className="text-sm text-gray-700">
                {formatDate(vendor.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Vendor Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">
              Total Items
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {vendor.itemCount}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">Role</div>
            <div className="text-2xl font-bold text-purple-900">
              {vendor.role.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => navigate(`/admin/vendors/${vendor.id}/items`)}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View Items
        </button>
        <button
          onClick={() => navigate(`/admin/vendors/${vendor.id}/edit`)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Edit Vendor
        </button>
      </div>
    </div>
  );
};

export default VendorDetails;
