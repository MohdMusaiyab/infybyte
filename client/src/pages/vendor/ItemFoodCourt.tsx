import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";

interface FoodCourtAssociation {
  _id: string;
  foodCourtId: string;
  foodCourtName: string;
  location: string;
  status: string;
  price?: number;
  timeSlot: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  _id: string;
  name: string;
  basePrice: number;
}

const ItemFoodCourt: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [item, setItem] = useState<Item | null>(null);
  const [foodCourts, setFoodCourts] = useState<FoodCourtAssociation[]>([]);
  
  const statusOptions = ["available", "notavailable", "sellingfast", "finishingsoon"];
  const timeSlotOptions = ["breakfast", "lunch", "snacks", "dinner"];

  const fetchItemFoodCourts = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(`/vendor/items/${id}/foodcourts`);
      const data = response.data.data;
      
      setItem(data.item);
      setFoodCourts(data.foodCourts || []);

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load item food courts");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchItemFoodCourts();
    }
  }, [id, fetchItemFoodCourts]);

  const handleUpdateFoodCourtItem = async (foodCourtItemId: string, field: string, value: string | number | boolean) => {
    try {
      setUpdating(foodCourtItemId);
      setError("");

      const updateData: Record<string, string | number | boolean> = { [field]: value };
      await axiosInstance.put(`/vendor/foodcourt-items/${foodCourtItemId}`, updateData);
      
      // Refresh data
      await fetchItemFoodCourts();
      
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to update food court item");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteFoodCourtItem = async (foodCourtItemId: string) => {
    if (!window.confirm("Are you sure you want to remove this item from the food court?")) {
      return;
    }

    try {
      setUpdating(foodCourtItemId);
      setError("");

      await axiosInstance.delete(`/vendor/foodcourt-items/${foodCourtItemId}`);
      
      // Refresh data
      await fetchItemFoodCourts();
      
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to remove item from food court");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleBackToEdit = () => {
    navigate(`/vendor/items/edit/${id}`);
  };

  const handleAddToFoodCourt = () => {
    navigate(`/vendor/foodcourt-items/add?itemId=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading item food courts...</div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-600 mt-2">{error}</div>
          <button 
            onClick={() => navigate("/vendor/items")}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleBackToEdit}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Edit Item
            </button>
            <button
              onClick={handleAddToFoodCourt}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Add to Food Court
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Food Courts - {item?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Manage item availability and pricing across different food courts
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-600 mt-1">{error}</div>
          </div>
        )}

        {foodCourts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Food Courts Found</h3>
            <p className="text-gray-500 mb-6">This item is not available in any food courts yet.</p>
            <button
              onClick={handleAddToFoodCourt}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Add to First Food Court
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Food Court
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {foodCourts.map((fc) => (
                    <tr key={fc._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{fc.foodCourtName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{fc.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={fc.price || item?.basePrice || 0}
                          onChange={(e) => handleUpdateFoodCourtItem(fc._id, "price", parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={updating === fc._id}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={fc.status}
                          onChange={(e) => handleUpdateFoodCourtItem(fc._id, "status", e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          disabled={updating === fc._id}
                        >
                          {statusOptions.map(option => (
                            <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={fc.timeSlot}
                          onChange={(e) => handleUpdateFoodCourtItem(fc._id, "timeSlot", e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          disabled={updating === fc._id}
                        >
                          {timeSlotOptions.map(option => (
                            <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUpdateFoodCourtItem(fc._id, "isActive", !fc.isActive)}
                          disabled={updating === fc._id}
                          className={`w-16 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            fc.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {fc.isActive ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteFoodCourtItem(fc._id)}
                            disabled={updating === fc._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {updating === fc._id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemFoodCourt;