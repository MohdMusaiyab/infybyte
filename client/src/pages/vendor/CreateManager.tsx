import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={handleBackToManagers}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Managers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Manager</h1>
          <p className="text-gray-600 mt-2">Assign a manager to help operate your food courts</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-600 mt-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Search and Selection */}
            <div>
              <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Search User by Email
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="userSearch"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email to search users..."
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {/* User Selection */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                Select User *
              </label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a user</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {availableUsers.length === 0 ? "No users found. Try searching by email." : "Select a user to assign as manager"}
              </p>
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contactNo"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1234567890"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter in E.164 format (e.g., +1234567890)
              </p>
            </div>

            {/* Food Court Assignment */}
            <div>
              <label htmlFor="foodCourtId" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Food Court *
              </label>
              <select
                id="foodCourtId"
                name="foodCourtId"
                value={formData.foodCourtId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a food court</option>
                {foodCourts.map(fc => (
                  <option key={fc.id} value={fc.id}>
                    {fc.name} - {fc.location}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose which food court this manager will operate
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBackToManagers}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.userId || !formData.contactNo || !formData.foodCourtId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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