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
  Eye,
  X,
  AlertTriangle,
  UserMinus,
  AlertCircle,
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

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isProcessing,
  variant = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  isProcessing: boolean;
  variant?: "danger" | "info";
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div
            className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
              variant === "danger" ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            {variant === "danger" ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <div className="text-gray-600 text-sm leading-relaxed mb-6">
            {message}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={isProcessing}
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              disabled={isProcessing}
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-black hover:bg-gray-800"
              } disabled:opacity-50`}
            >
              {isProcessing && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isProcessing ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        setVendor(response?.data?.data);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDemoteToUser = async () => {
    if (!vendor) return;
    try {
      setIsUpdating(true);
      await axiosInstance.patch(`/admin/vendors/${vendor.id}/status`, {
        role: "user",
      });
      setShowDemoteModal(false);
      setShowSuccessModal(true);
      setTimeout(() => navigate("/admin/all-vendors"), 2000);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0 p-4">
        <button
          onClick={() => navigate("/admin/all-vendors")}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm break-words">
            {error || "Vendor not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 pb-24 lg:pb-6">
      <ConfirmModal
        isOpen={showDemoteModal}
        isProcessing={isUpdating}
        onClose={() => setShowDemoteModal(false)}
        onConfirm={handleDemoteToUser}
        title="Confirm Demotion"
        message={
          <>
            Are you sure you want to demote{" "}
            <span className="font-bold text-gray-900">"{vendor.shopName}"</span>
            ?
            <br />
            <br />
            This will{" "}
            <span className="text-red-600 font-bold">
              PERMANENTLY delete
            </span>{" "}
            all menu items, shop data, and manager links.
          </>
        }
      />

      <ConfirmModal
        isOpen={showSuccessModal}
        isProcessing={false}
        onClose={() => {}}
        onConfirm={() => {}}
        variant="info"
        title="Success!"
        message="Vendor has been demoted. Redirecting to list..."
      />

      <button
        onClick={() => navigate("/admin/all-vendors")}
        className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Vendors</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Store className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 break-words leading-tight">
            {vendor.name}
          </h1>
          <p className="text-sm md:text-base text-gray-500 break-all">
            {vendor.email}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">
            Vendor Information
          </h2>
        </div>
        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {[
            { label: "Shop Name", val: vendor.shopName, icon: Store },
            {
              label: "Total Items",
              val: `${vendor.itemCount} items listed`,
              icon: Package,
            },
            {
              label: "Vendor ID",
              val: vendor.vendorId,
              icon: Hash,
              mono: true,
            },
            { label: "User ID", val: vendor.id, icon: Hash, mono: true },
            {
              label: "Created At",
              val: formatDate(vendor.createdAt),
              icon: Calendar,
            },
            {
              label: "Last Updated",
              val: formatDate(vendor.updatedAt),
              icon: Calendar,
            },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </label>
              <p
                className={`text-base font-semibold text-gray-900 break-all ${
                  item.mono
                    ? "font-mono text-sm bg-gray-50 px-2 py-1 rounded"
                    : ""
                }`}
              >
                {item.val}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/admin/vendors/${vendor.id}/items`)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg text-base"
        >
          <Eye className="w-5 h-5" />
          View All Items
        </button>
      </div>

      <div className="mt-8">
        <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="font-bold text-red-800">Demote to Regular User</p>
              <p className="text-sm text-red-600/80 mt-1 leading-relaxed">
                This removes all vendor-specific data. This action is
                irreversible. Please ensure you have confirmed this with the
                store owner.
              </p>
            </div>
            <button
              onClick={() => setShowDemoteModal(true)}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-[0.98]"
            >
              <UserMinus className="w-5 h-5" />
              Demote Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;
