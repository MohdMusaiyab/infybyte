import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, Save, Phone, Store, User, Mail, Calendar, UserCheck, UserX } from "lucide-react";

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

  if (error && !manager) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={handleBackToManagers}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              Back to Managers
            </button>
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
          <h1 className="text-3xl font-bold text-black mb-2">Edit Manager</h1>
          <p className="text-gray-600">Update contact information and food court assignment</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="text-red-800 font-bold">Error</div>
              <div className="text-red-600 mt-1">{error}</div>
            </div>
          )}

          {/* Manager Info Display (Read-only) */}
          {manager && (
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mb-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Manager Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-black font-medium">{manager.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-black">{manager.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Food Court</p>
                    <p className="text-black">
                      {currentFoodCourt 
                        ? `${currentFoodCourt.name} - ${currentFoodCourt.location}`
                        : manager.foodCourtName && manager.location
                        ? `${manager.foodCourtName} - ${manager.location}`
                        : "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                    <p className="text-black">{new Date(manager.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                Assign to Food Court
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="foodCourtId"
                  name="foodCourtId"
                  value={formData.foodCourtId || ""}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
                >
                  <option value="">No food court assigned</option>
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
                Change or assign a food court to this manager. Select "No food court assigned" to remove assignment.
              </p>
            </div>

            {/* Active Status */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-black transition-colors cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  formData.isActive 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300 group-hover:border-black'
                }`}>
                  {formData.isActive && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {formData.isActive ? (
                  <UserCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <UserX className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium text-black">Manager is active and can access the system</span>
              </div>
            </label>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBackToManagers}
                className="flex-1 sm:flex-none px-6 py-3 bg-white text-black rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Save className="w-5 h-5" />
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