import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, Save, Utensils, DollarSign, Tag, Leaf, Star, Store, MapPin } from "lucide-react";

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
      
      navigate("/vendor/item-management");
      
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
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={handleBackToItems}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              Back to Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={handleBackToItems}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Items
          </button>
          <h1 className="text-3xl font-bold text-black mb-2">Edit Item</h1>
          <p className="text-gray-600">Update item details and manage food court availability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <div className="text-red-800 font-bold">Error</div>
                  <div className="text-red-600 mt-1">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Item Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-3">
                    Item Name *
                  </label>
                  <div className="relative">
                    <Utensils className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors resize-none"
                    placeholder="Enter item description (optional)"
                  />
                </div>

                {/* Price and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Price */}
                  <div>
                    <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-3">
                      Base Price (₹) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        id="basePrice"
                        name="basePrice"
                        value={formData.basePrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-3">
                      Category *
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category} className="capitalize">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Veg/Non-Veg */}
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-black transition-colors cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="isVeg"
                        name="isVeg"
                        checked={formData.isVeg}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        formData.isVeg 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 group-hover:border-black'
                      }`}>
                        {formData.isVeg && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Leaf className={`w-5 h-5 ${formData.isVeg ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="font-medium text-black">Vegetarian Item</span>
                    </div>
                  </label>

                  {/* Special Item */}
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-black transition-colors cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="isSpecial"
                        name="isSpecial"
                        checked={formData.isSpecial}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        formData.isSpecial 
                          ? 'bg-yellow-500 border-yellow-500' 
                          : 'border-gray-300 group-hover:border-black'
                      }`}>
                        {formData.isSpecial && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className={`w-5 h-5 ${formData.isSpecial ? 'text-yellow-500' : 'text-gray-400'}`} />
                      <span className="font-medium text-black">Special Item</span>
                    </div>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleBackToItems}
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
                    {updating ? "Updating..." : "Update Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Food Courts Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-black">Food Courts</h3>
                <button
                  onClick={handleManageFoodCourts}
                  className="flex items-center gap-1 text-black hover:text-gray-600 text-sm font-medium transition-colors"
                >
                  <Store className="w-4 h-4" />
                  Manage
                </button>
              </div>
              
              {foodCourts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Store className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">Not available in any food courts</p>
                  <button
                    onClick={handleManageFoodCourts}
                    className="text-black hover:text-gray-600 text-sm font-medium transition-colors"
                  >
                    Add to food courts
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {foodCourts.map((fc) => (
                    <div key={fc._id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-black transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-black truncate">{fc.foodCourtName}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-sm text-gray-600 truncate">{fc.location}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              fc.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {fc.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs font-bold text-black">₹{fc.price || formData.basePrice}</span>
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