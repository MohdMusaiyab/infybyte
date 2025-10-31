import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";

interface FoodCourtAssociation {
  id: string;
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
  id: string;
  name: string;
  basePrice: number;
}

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
}

const ItemFoodCourt: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [item, setItem] = useState<Item | null>(null);
  const [foodCourts, setFoodCourts] = useState<FoodCourtAssociation[]>([]);
  const [availableFoodCourts, setAvailableFoodCourts] = useState<FoodCourt[]>([]);
  
  const statusOptions = ["available", "notavailable", "sellingfast", "finishingsoon"];
  const timeSlotOptions = ["breakfast", "lunch", "snacks", "dinner"];

  const fetchItemFoodCourts = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [itemFoodCourtsResponse, availableFoodCourtsResponse] = await Promise.all([
        axiosInstance.get(`/vendor/items/${id}/foodcourts`),
        axiosInstance.get("/vendor/foodcourts")
      ]);

      const itemData = itemFoodCourtsResponse.data.data;
      const availableFcData = availableFoodCourtsResponse.data.data || [];
      
      setItem(itemData.item);
      setFoodCourts(itemData.foodCourts || []);
      setAvailableFoodCourts(availableFcData);

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load data");
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

  // Create a map of existing food court associations for quick lookup
  const getFoodCourtAssociationMap = () => {
    const map = new Map<string, FoodCourtAssociation>();
    foodCourts.forEach(fc => {
      map.set(fc.foodCourtId, fc);
    });
    return map;
  };

  const handleUpdateFoodCourtItem = async (foodCourtItemId: string, field: string, value: string | number | boolean) => {
    try {
      setUpdating(foodCourtItemId);
      setError("");

      const updateData: Record<string, string | number | boolean> = { [field]: value };
      await axiosInstance.put(`/vendor/foodcourt-items/${foodCourtItemId}`, updateData);
      
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

      axiosInstance.delete(`/vendor/foodcourt-items?itemId=${id}&foodCourtId=${foodCourtItemId}`)
      
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

  const handleAddToFoodCourt = async (foodCourtId: string) => {
    try {
      setAdding(true);
      setError("");

      const submitData = {
        itemId: id,
        foodCourtId: foodCourtId,
        status: "available",
        timeSlot: "breakfast",
      };
      console.log("Submitting data:", submitData);
      await axiosInstance.post("/vendor/foodcourt-items", submitData);
      
      await fetchItemFoodCourts();
      
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to add item to food court");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleBackToEdit = () => {
    navigate(`/vendor/items/edit/${id}`);
  };

  const foodCourtAssociationMap = getFoodCourtAssociationMap();

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
          <button 
            onClick={handleBackToEdit}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Edit Item
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Food Courts - {item?.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Manage item availability across all your food courts
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-600 mt-1">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Food Courts with Item */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Food Courts with This Item ({foodCourts.length})
            </h2>
            {foodCourts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-gray-500">This item is not available in any food courts yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {foodCourts.map((fc) => (
                  <div key={fc.id} className="bg-white rounded-lg shadow border-l-4 border-green-500 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{fc.foodCourtName}</h3>
                        <p className="text-sm text-gray-500">{fc.location}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Added
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={fc.price || item?.basePrice || 0}
                          onChange={(e) => handleUpdateFoodCourtItem(fc.id, "price", parseFloat(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={updating === fc.id}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select
                          value={fc.status}
                          onChange={(e) => handleUpdateFoodCourtItem(fc.id, "status", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={updating === fc.id}
                        >
                          {statusOptions.map(option => (
                            <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Time Slot</label>
                        <select
                          value={fc.timeSlot}
                          onChange={(e) => handleUpdateFoodCourtItem(fc.id, "timeSlot", e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={updating === fc.id}
                        >
                          {timeSlotOptions.map(option => (
                            <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Active</label>
                        <button
                          onClick={() => handleUpdateFoodCourtItem(fc.id, "isActive", !fc.isActive)}
                          disabled={updating === fc.id}
                          className={`w-full px-3 py-1 rounded text-xs font-medium transition-colors ${
                            fc.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {fc.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteFoodCourtItem(fc.foodCourtId)}
                        disabled={updating === fc.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        {updating === fc.id ? 'Removing...' : 'Remove from Food Court'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Food Courts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Food Courts ({availableFoodCourts.length - foodCourts.length})
            </h2>
            {availableFoodCourts.filter(fc => !foodCourtAssociationMap.has(fc.id)).length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-500">This item is available in all your food courts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableFoodCourts
                  .filter(fc => !foodCourtAssociationMap.has(fc.id))
                  .map((fc) => (
                    <div key={fc.id} className="bg-white rounded-lg shadow border-l-4 border-blue-500 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{fc.name}</h3>
                          <p className="text-sm text-gray-500">{fc.location}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Available
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {fc.isOpen ? (
                            <span className="text-green-600">● Open</span>
                          ) : (
                            <span className="text-red-600">● Closed</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToFoodCourt(fc.id)}
                          disabled={adding}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {adding ? 'Adding...' : 'Add Item'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemFoodCourt;