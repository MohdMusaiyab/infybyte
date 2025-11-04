import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, Search, User, Mail, Phone, MapPin, Save, Users, Store } from "lucide-react";

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
    foodCourtId: ""
  });

  useEffect(() => {
    fetchFoodCourts();
    fetchUsers();
  }, []);

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
      const params = emailSearch ? { email: emailSearch } : {};
      const response = await axiosInstance.get("/vendor/users", { params });
      setAvailableUsers(response.data.data.users || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load users");
      } else {
        setError("An unexpected error occurred");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.contactNo || !formData.foodCourtId) {
      setError("Please fill in all required fields");
      return;
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.contactNo)) {
      setError("Please enter a valid phone number in E.164 format (e.g., +1234567890)");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const submitData = {
        userId: formData.userId,
        contactNo: formData.contactNo,
        foodCourtId: formData.foodCourtId
      };

      await axiosInstance.post("/vendor/managers", submitData);
      navigate("/vendor/managers");
      
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to create manager");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToManagers = () => {
    navigate("/vendor/managers");
  };

  if (fetching) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={handleBackToManagers}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Managers
          </button>
          <h1 className="text-3xl font-bold text-black mb-2">Add New Manager</h1>
          <p className="text-gray-600">Assign a manager to help operate your food courts</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="text-red-800 font-bold">Error</div>
              <div className="text-red-600 mt-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Search and Selection */}
            <div>
              <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-3">
                Search User by Email
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="userSearch"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                    placeholder="Enter email to search users..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium disabled:opacity-50"
                >
                  {searching ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Search
                </button>
              </form>
            </div>

            {/* User Selection */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-3">
                Select User *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
                  required
                >
                  <option value="">Choose a user</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {availableUsers.length === 0 ? "No users found. Try searching by email." : `${availableUsers.length} user(s) found`}
              </p>
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700 mb-3">
                Contact Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  placeholder="+1234567890"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter in E.164 format (e.g., +1234567890)
              </p>
            </div>

            {/* Food Court Assignment */}
            <div>
              <label htmlFor="foodCourtId" className="block text-sm font-medium text-gray-700 mb-3">
                Assign to Food Court *
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="foodCourtId"
                  name="foodCourtId"
                  value={formData.foodCourtId}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
                  required
                >
                  <option value="">Select a food court</option>
                  {foodCourts.map(fc => (
                    <option key={fc.id} value={fc.id}>
                      {fc.name} - {fc.location}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Choose which food court this manager will operate
              </p>
            </div>

            {/* Selected User Preview */}
            {formData.userId && (
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <h4 className="font-bold text-black mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Selected User
                </h4>
                {availableUsers
                  .filter(user => user.id === formData.userId)
                  .map(user => (
                    <div key={user.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-black">{user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Member since {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBackToManagers}
                className="flex-1 sm:flex-none px-6 py-3 bg-white text-black rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.userId || !formData.contactNo || !formData.foodCourtId}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Save className="w-5 h-5" />
                {loading ? "Creating..." : "Create Manager"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateManager;