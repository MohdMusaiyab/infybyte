import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, Phone, Store, User, UserCheck, UserX } from "lucide-react";

interface FoodCourt {
  id?: string;
  _id?: string;
  name: string;
  location: string;
  timings?: string;
  isOpen?: boolean;
}

interface Manager {
  id: string;
  user_id: string;
  userName: string;
  userEmail: string;
  contact_no: string;
  isActive: boolean;
  foodCourts: FoodCourt[];
  createdAt: string;
  updatedAt: string;
}

interface UpdateManagerData {
  contactNo: string;
  foodCourtId: string | null;
  isActive: boolean;
}

const EditManager: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [manager, setManager] = useState<Manager | null>(null);
  const [availableFoodCourts, setAvailableFoodCourts] = useState<FoodCourt[]>(
    []
  );

  const [formData, setFormData] = useState<UpdateManagerData>({
    contactNo: "",
    foodCourtId: "",
    isActive: true,
  });

  const fetchManagerData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [managerResponse, foodCourtsResponse] = await Promise.all([
        axiosInstance.get(`/vendor/managers/${id}`),
        axiosInstance.get("/vendor/foodcourts"),
      ]);

      const managerData: Manager = managerResponse.data.data;
      const allVendorCourts: FoodCourt[] = foodCourtsResponse.data.data || [];

      setManager(managerData);
      setAvailableFoodCourts(allVendorCourts);

      const currentFC =
        managerData.foodCourts && managerData.foodCourts.length > 0
          ? managerData.foodCourts[0]
          : null;

      setFormData({
        contactNo: managerData.contact_no,
        foodCourtId: currentFC ? currentFC._id || currentFC.id || "" : "",
        isActive: managerData.isActive,
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to load manager data"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchManagerData();
    }
  }, [id, fetchManagerData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contactNo) {
      setError("Contact number is required");
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const payload = {
        contactNo: formData.contactNo,
        isActive: formData.isActive,
        foodCourtId: formData.foodCourtId || null,
      };

      await axiosInstance.put(`/vendor/managers/${id}`, payload);
      navigate("/vendor/managers");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to update manager"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  const assignedFC = manager?.foodCourts?.[0];

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse text-gray-500">
        Loading manager details...
      </div>
    );

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/vendor/managers")}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 group transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Managers
          </button>
          <h1 className="text-3xl font-bold text-black mb-2">Edit Manager</h1>
          <p className="text-gray-600">
            Update contact information and food court assignment
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-red-700">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mb-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500">Name</span>
                <span className="font-bold text-black">
                  {manager?.userName}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500">Email</span>
                <span className="font-bold text-black">
                  {manager?.userEmail}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500">Assigned Food Court</span>
                <span className="font-bold text-black">
                  {assignedFC
                    ? `${assignedFC.name} (${assignedFC.location})`
                    : "Not Assigned"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500">Member Since</span>
                <span className="font-bold text-black">
                  {manager
                    ? new Date(manager.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-all"
                  placeholder="+91..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Assign Food Court
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="foodCourtId"
                  value={formData.foodCourtId || ""}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black outline-none transition-all appearance-none bg-white"
                >
                  <option value="">No food court assigned</option>
                  {availableFoodCourts.map((fc) => (
                    <option key={fc.id || fc._id} value={fc.id || fc._id}>
                      {fc.name} - {fc.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-black transition-all">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 accent-black"
              />
              <span className="font-medium flex items-center gap-2">
                {formData.isActive ? (
                  <UserCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <UserX className="w-5 h-5 text-gray-400" />
                )}
                Account Active
              </span>
            </label>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/vendor/managers")}
                className="flex-1 py-3 border-2 border-black rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditManager;
