import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";

interface Item {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FoodCourtAssociation {
  _id: string;
  foodCourtId: string;
  foodCourtName: string;
  location: string;
  status: string;
  price?: number;
  timeSlot: string;
  isActive: boolean;
}

const EditItem: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [foodCourts, setFoodCourts] = useState<FoodCourtAssociation[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "",
    isVeg: true,
    isSpecial: false,
  });

  const categories = [
    "breakfast",
    "maincourse", 
    "dessert",
    "beverage",
    "dosa",
    "northmeal",
    "paratha",
    "chinese",
    "combo"
  ];

  const fetchItemData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [itemResponse, foodCourtsResponse] = await Promise.all([
        axiosInstance.get(`/vendor/items/${id}`),
        axiosInstance.get(`/vendor/items/${id}/foodcourts`)
      ]);

      const item = itemResponse.data.data as Item;
      setFormData({
        name: item.name,
        description: item.description || "",
        basePrice: item.basePrice.toString(),
        category: item.category,
        isVeg: item.isVeg,
        isSpecial: item.isSpecial,
      });

      setFoodCourts(foodCourtsResponse.data.data.foodCourts || []);

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load item data");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchItemData();
    }
  }, [id, fetchItemData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    
    if (!formData.name || !formData.basePrice || !formData.category) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const submitData = {
        name: formData.name,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        category: formData.category,
        isVeg: formData.isVeg,
        isSpecial: formData.isSpecial,
      };

      await axiosInstance.put(`/vendor/items/${id}`, submitData);
      
      navigate("/vendor/items");
      
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to update item");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleManageFoodCourts = () => {
    navigate(`/vendor/items/${id}/foodcourts`);
  };

  const handleBackToItems = () => {
    navigate("/vendor/items");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading item data...</div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-red-800 font-semibold">Error</div>
          <div className="text-red-600 mt-2">{error}</div>
          <button 
            onClick={handleBackToItems}
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={handleBackToItems}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Items
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Item</h1>
          <p className="text-gray-600 mt-2">Update item details and manage food court availability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-red-800 font-medium">Error</div>
                  <div className="text-red-600 mt-1">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Item Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter item name"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter item description (optional)"
                  />
                </div>

                {/* Price and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Price */}
                  <div>
                    <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      id="basePrice"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Veg/Non-Veg */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isVeg"
                      name="isVeg"
                      checked={formData.isVeg}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isVeg" className="ml-2 block text-sm text-gray-900">
                      Vegetarian Item
                    </label>
                  </div>

                  {/* Special Item */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isSpecial"
                      name="isSpecial"
                      checked={formData.isSpecial}
                      onChange={handleChange}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isSpecial" className="ml-2 block text-sm text-gray-900">
                      Special Item
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleBackToItems}
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
                    {updating ? "Updating..." : "Update Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Food Courts Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Food Courts</h3>
                <button
                  onClick={handleManageFoodCourts}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage
                </button>
              </div>
              
              {foodCourts.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 text-sm">Not available in any food courts</p>
                  <button
                    onClick={handleManageFoodCourts}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Add to food courts
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {foodCourts.map((fc) => (
                    <div key={fc._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{fc.foodCourtName}</h4>
                          <p className="text-sm text-gray-500">{fc.location}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              fc.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {fc.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-gray-500">₹{fc.price || formData.basePrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditItem;