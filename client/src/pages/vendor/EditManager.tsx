import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";

interface Manager {
  id: string;
  user_id: string;
  userName: string;
  userEmail: string;
  contact_no: string;
  isActive: boolean;
  foodCourtId?: string;
  foodCourtName?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  timings: string;
  isOpen: boolean;
  weekends: boolean;
  weekdays: boolean;
  createdAt: string;
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
  const [foodCourts, setFoodCourts] = useState<FoodCourt[]>([]);
  
  const [formData, setFormData] = useState<UpdateManagerData>({
    contactNo: "",
    foodCourtId: "",
    isActive: true
  });

  const fetchManagerData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [managerResponse, foodCourtsResponse] = await Promise.all([
        axiosInstance.get(`/vendor/managers/${id}`),
        axiosInstance.get("/vendor/foodcourts")
      ]);

      const managerData: Manager = managerResponse.data.data;
      setManager(managerData);
      
      const vendorFoodCourts: FoodCourt[] = foodCourtsResponse.data.data || [];
      
      // Ensure manager's current food court is in the options
      const allFoodCourts: FoodCourt[] = [...vendorFoodCourts];
      
      if (managerData.foodCourtId && managerData.foodCourtName && managerData.location) {
        const currentFoodCourtExists = vendorFoodCourts.some(fc => fc.id === managerData.foodCourtId);
        
        if (!currentFoodCourtExists) {
          // Add the manager's current food court to the options
          allFoodCourts.push({
            id: managerData.foodCourtId,
            name: managerData.foodCourtName,
            location: managerData.location,
            timings: "",
            isOpen: true,
            weekends: true,
            weekdays: true,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      setFoodCourts(allFoodCourts);
      
      setFormData({
        contactNo: managerData.contact_no,
        foodCourtId: managerData.foodCourtId || "",
        isActive: managerData.isActive
      });

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load manager data");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contactNo) {
      setError("Contact number is required");
      return;
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.contactNo)) {
      setError("Please enter a valid phone number in E.164 format (e.g., +1234567890)");
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const updateData: {
        contactNo: string;
        isActive: boolean;
        foodCourtId?: string | null;
      } = {
        contactNo: formData.contactNo,
        isActive: formData.isActive
      };

      // Include foodCourtId only if it's provided
      if (formData.foodCourtId) {
        updateData.foodCourtId = formData.foodCourtId;
      } else {
        // If foodCourtId is empty string, set it to null to remove assignment
        updateData.foodCourtId = null;
      }

      await axiosInstance.put(`/vendor/managers/${id}`, updateData);
      navigate("/vendor/managers");
      
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to update manager");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleBackToManagers = () => {
    navigate("/vendor/managers");
  };

  // Find the current food court object for display
  const currentFoodCourt = manager?.foodCourtId 
    ? foodCourts.find(fc => fc.id === manager.foodCourtId)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading manager data...</div>
      </div>
    );
  }

  if (error && !manager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-600 mt-2">{error}</div>
          <button 
            onClick={handleBackToManagers}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Back to Managers
          </button>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Manager</h1>
          <p className="text-gray-600 mt-2">Update contact information and food court assignment</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-600 mt-1">{error}</div>
            </div>
          )}

          {/* Manager Info Display (Read-only) */}
          {manager && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Manager Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900 font-medium">{manager.userName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{manager.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Food Court</p>
                  <p className="text-gray-900">
                    {currentFoodCourt 
                      ? `${currentFoodCourt.name} - ${currentFoodCourt.location}`
                      : manager.foodCourtName && manager.location
                      ? `${manager.foodCourtName} - ${manager.location}`
                      : "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-gray-900">{new Date(manager.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                Assign to Food Court
              </label>
              <select
                id="foodCourtId"
                name="foodCourtId"
                value={formData.foodCourtId || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No food court assigned</option>
                {foodCourts.map(fc => (
                  <option key={fc.id} value={fc.id}>
                    {fc.name} - {fc.location}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Change or assign a food court to this manager. Select "No food court assigned" to remove assignment.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Manager is active and can access the system
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBackToManagers}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating..." : "Update Manager"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditManager;