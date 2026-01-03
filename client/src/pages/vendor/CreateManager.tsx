import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Users,
  Store,
} from "lucide-react";

interface FoodCourt {
  id: string;
  name: string;
  location: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const CreateManager: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [foodCourts, setFoodCourts] = useState<FoodCourt[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState<string>("");

  const [formData, setFormData] = useState({
    userId: "",
    contactNo: "",
    foodCourtId: "",
  });

  useEffect(() => {
    fetchFoodCourts();
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchEmail.trim()) return availableUsers;
    return availableUsers?.filter(
      (user) =>
        user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        user.name.toLowerCase().includes(searchEmail.toLowerCase())
    );
  }, [searchEmail, availableUsers]);

  const fetchFoodCourts = async () => {
    try {
      const response = await axiosInstance.get("/vendor/foodcourts");
      setFoodCourts(response.data.data || []);
    } catch (err: unknown) {
      console.error("Failed to fetch food courts:", err);
    }
  };

  const fetchUsers = async (emailSearch: string = "") => {
    try {
      setSearching(true);
      setError("");
      const params = emailSearch ? { email: emailSearch } : {};
      const response = await axiosInstance.get("/vendor/users", { params });

      const newUsers = response.data.data.users || [];

      if (emailSearch) {
        setAvailableUsers((prev) => {
          const existingIds = new Set(prev?.map((u) => u.id));
          const uniqueNew = newUsers?.filter(
            (u: User) => !existingIds.has(u.id)
          );
          return [...prev, ...uniqueNew];
        });
      } else {
        setAvailableUsers(newUsers);
      }

      if (emailSearch && newUsers?.length === 0) {
        setError("No user found in database with that email.");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string };
        setError(responseData?.message ?? "Failed to load users");
      }
    } finally {
      setSearching(false);
      setFetching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchEmail);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.contactNo || !formData.foodCourtId) {
      setError("Please fill in all required fields");
      return;
    }

    const phoneRegex = /^\d{10}$/;

    if (!phoneRegex.test(formData.contactNo)) {
      setError("Please enter a valid 10-digit phone number (e.g., 9876543210)");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post("/vendor/managers", formData);
      navigate("/vendor/managers");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string };
        setError(responseData?.message ?? "Failed to create manager");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-4">
            {[...Array(4)]?.map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-12 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/vendor/managers")}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Managers
          </button>
          <h1 className="text-3xl font-bold text-black mb-2">
            Add New Manager
          </h1>
          <p className="text-gray-600">
            Assign a manager to operate your food courts
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-red-800">
              <div className="font-bold">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filter / Search by Email
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black outline-none"
                    placeholder="Start typing to filter, or search DB..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all font-medium flex items-center gap-2"
                >
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search DB
                </button>
              </form>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select User *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black outline-none appearance-none bg-white"
                    required
                  >
                    <option value="">
                      Choose a user ({filteredUsers?.length} matches)
                    </option>
                    {filteredUsers?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="contactNo"
                      value={formData.contactNo}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black outline-none"
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Assign Food Court *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="foodCourtId"
                      value={formData.foodCourtId}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black outline-none appearance-none bg-white"
                      required
                    >
                      <option value="">Select court</option>
                      {foodCourts?.map((fc) => (
                        <option key={fc.id} value={fc.id}>
                          {fc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {formData.userId && (
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <h4 className="font-bold text-black mb-3 flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" /> Selected Manager Detail
                  </h4>
                  {availableUsers
                    ?.filter((u) => u.id === formData.userId)
                    ?.map((u) => (
                      <div
                        key={u.id}
                        className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" /> {u.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" /> {u.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Joined:{" "}
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-black rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />{" "}
                  {loading ? "Creating..." : "Create Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateManager;
