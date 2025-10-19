"use client";
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import axios from "axios";

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

  // 🔹 Fetch FoodCourt + Vendors assigned
  const fetchFoodCourt = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/admin/get-food-court-details/${id}`);
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

  // 🔹 Fetch Available Vendors (for dropdown)
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

  // 🔹 Handle Edit Form Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 🔹 Update Food Court
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    setSuccess("");
    try {
      await axiosInstance.put(`/admin/food-courts/${id}`, editForm);
      setSuccess("✅ Food court updated successfully!");
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

  // 🔹 Add Vendor to Food Court
  const handleAddVendor = async () => {
    if (!id || !selectedVendor) return;
    setError("");
    setSuccess("");
    try {
      await axiosInstance.post(
        `/admin/food-courts/${id}/add-vendor/${selectedVendor}`
      );
      setSuccess("✅ Vendor added successfully!");
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

  // 🔹 Remove Vendor from Food Court
  const handleRemoveVendor = async (vendorId: string) => {
    if (!id || !vendorId) return;
    const confirmRemove = confirm("Are you sure you want to remove this vendor?");
    if (!confirmRemove) return;

    setError("");
    setSuccess("");
    try {
      await axiosInstance.delete(
        `/admin/food-courts/${id}/remove-vendor/${vendorId}`
      );
      setSuccess("✅ Vendor removed successfully!");
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

  // 🔹 Delete Food Court
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

  if (loading) return <p>Loading food court details...</p>;
  if (error && !foodCourt)
    return <p className="text-red-500">{error}</p>;
  if (!foodCourt) return <p>No food court found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{foodCourt.name}</h1>

      {/* ✅ Success/Error */}
      {success && <p className="text-green-600 mb-2">{success}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {/* ✅ Editable Form */}
      <form onSubmit={handleUpdate} className="space-y-3 border p-4 rounded-lg">
        <div>
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={editForm.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-semibold">Location</label>
          <input
            type="text"
            name="location"
            value={editForm.location}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-semibold">Timings</label>
          <input
            type="text"
            name="timings"
            value={editForm.timings}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="flex gap-4">
          <label>
            <input
              type="checkbox"
              name="weekdays"
              checked={editForm.weekdays}
              onChange={handleChange}
            />{" "}
            Weekdays
          </label>
          <label>
            <input
              type="checkbox"
              name="weekends"
              checked={editForm.weekends}
              onChange={handleChange}
            />{" "}
            Weekends
          </label>
          <label>
            <input
              type="checkbox"
              name="isOpen"
              checked={editForm.isOpen}
              onChange={handleChange}
            />{" "}
            Open
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update Food Court
        </button>
      </form>

      {/* ✅ Vendors List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Vendors</h2>
        {vendors.length > 0 ? (
          <ul className="list-disc ml-6 space-y-2">
            {vendors.map((vendor) => (
              <li
                key={vendor._id}
                className="flex items-center justify-between"
              >
                <Link
                  to={`/vendor/${vendor._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {vendor.shopName}
                </Link>
                <button
                  onClick={() => handleRemoveVendor(vendor._id)}
                  className="text-red-600 hover:text-red-800 font-semibold"
                >
                  ❌ Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No vendors assigned yet.</p>
        )}
      </div>

      {/* ✅ Add Vendor Dropdown */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">Add Vendor</label>
        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">Select Vendor</option>
          {availableVendors.map((v) => (
            <option key={v._id} value={v._id}>
              {v.shopName}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddVendor}
          disabled={!selectedVendor}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Vendor
        </button>
      </div>

      {/* ✅ Delete Food Court */}
      <div className="mt-6">
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete Food Court
        </button>
      </div>

      {/* ✅ Created/Updated At */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(foodCourt.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Updated At:</strong>{" "}
          {new Date(foodCourt.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default SingleFoodCourtDetails;
