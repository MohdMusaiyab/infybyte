import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Save,
  Utensils,
  DollarSign,
  Tag,
  Leaf,
  Star,
} from "lucide-react";

const CreateItem: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
    "combo",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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
      setLoading(true);
      setError("");

      const submitData = {
        name: formData.name,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        category: formData.category,
        isVeg: formData.isVeg,
        isSpecial: formData.isSpecial,
      };

      await axiosInstance.post("/vendor/items", submitData);

      navigate("/vendor/items-management");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to create item"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/vendor/items-management")}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Items
          </button>
          <h1 className="text-3xl font-bold text-black mb-2">
            Create New Item
          </h1>
          <p className="text-gray-600">Add a new item to your menu</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="text-red-800 font-bold">Error</div>
              <div className="text-red-600 mt-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-3"
              >
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

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-3"
              >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="basePrice"
                  className="block text-sm font-medium text-gray-700 mb-3"
                >
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

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-3"
                >
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
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="capitalize"
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      formData.isVeg
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 group-hover:border-black"
                    }`}
                  >
                    {formData.isVeg && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf
                    className={`w-5 h-5 ${
                      formData.isVeg ? "text-green-500" : "text-gray-400"
                    }`}
                  />
                  <span className="font-medium text-black">
                    Vegetarian Item
                  </span>
                </div>
              </label>

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
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      formData.isSpecial
                        ? "bg-yellow-500 border-yellow-500"
                        : "border-gray-300 group-hover:border-black"
                    }`}
                  >
                    {formData.isSpecial && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star
                    className={`w-5 h-5 ${
                      formData.isSpecial ? "text-yellow-500" : "text-gray-400"
                    }`}
                  />
                  <span className="font-medium text-black">Special Item</span>
                </div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/vendor/items")}
                className="flex-1 sm:flex-none px-6 py-3 bg-white text-black rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Save className="w-5 h-5" />
                {loading ? "Creating..." : "Create Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateItem;
