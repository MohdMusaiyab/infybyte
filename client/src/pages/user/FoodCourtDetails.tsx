import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, MapPin, Clock, Search, Heart, ChefHat, Zap, Users, Tag } from "lucide-react";

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  timings: string;
  isOpen: boolean;
  weekends: boolean;
  weekdays: boolean;
}

interface Vendor {
  id: string;
  shopName: string;
  gst?: string;
}

interface FoodItem {
  itemId: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  vendorId: string;
  shopName: string;
  status: string;
  price?: number;
  timeSlot: string;
}

interface FoodCourtDetailsResponse {
  foodCourt: FoodCourt;
  vendors: Vendor[];
  items: FoodItem[];
}

const FoodCourtDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FoodCourtDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("all");

  const categories = ["all", "breakfast", "maincourse", "dessert", "beverage", "dosa", "northmeal", "paratha", "chinese", "combo"];
  const timeSlots = ["all", "breakfast", "lunch", "snacks", "dinner"];

  useEffect(() => {
    if (id) {
      fetchFoodCourtDetails();
    }
  }, [id]);

  const fetchFoodCourtDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get(`/user/foodcourts/${id}`);
      setData(response.data.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load food court details");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = data?.items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(item => 
    selectedCategory === "all" || item.category === selectedCategory
  ).filter(item =>
    selectedVendor === "all" || item.vendorId === selectedVendor
  ).filter(item =>
    selectedTimeSlot === "all" || item.timeSlot === selectedTimeSlot
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "sellingfast": return "bg-orange-100 text-orange-800";
      case "finishingsoon": return "bg-yellow-100 text-yellow-800";
      case "notavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleBack = () => {
    navigate("/user/dashboard");
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={fetchFoodCourtDetails}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium mr-4"
            >
              Try Again
            </button>
            <button 
              onClick={handleBack}
              className="bg-white text-black px-6 py-3 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-gray-600">Food court not found</div>
            <button 
              onClick={handleBack}
              className="mt-4 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        </div>

        {/* Food Court Header */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">{data.foodCourt.name}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{data.foodCourt.location}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{data.foodCourt.timings}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    data.foodCourt.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {data.foodCourt.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                  {data.foodCourt.weekdays && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Weekdays
                    </span>
                  )}
                  {data.foodCourt.weekends && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Weekends
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Vendors</span>
                </div>
                <div className="text-2xl font-bold text-black">{data.vendors.length}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm">Items</span>
                </div>
                <div className="text-2xl font-bold text-black">{data.items.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items or vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot Filter */}
            <div>
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot === "all" ? "All Times" : slot.charAt(0).toUpperCase() + slot.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor Filter */}
          {data.vendors.length > 0 && (
            <div className="mt-4">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedVendor("all")}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedVendor === "all"
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                  }`}
                >
                  All Vendors
                </button>
                {data.vendors.map(vendor => (
                  <button
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor.id === selectedVendor ? "all" : vendor.id)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      selectedVendor === vendor.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-200 hover:border-black'
                    }`}
                  >
                    {vendor.shopName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">No items found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== "all" || selectedVendor !== "all" || selectedTimeSlot !== "all"
                ? "Try adjusting your search or filter criteria" 
                : "No items available in this food court"}
            </p>
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-600">{filteredItems.length} item(s) found</span>
              {(searchTerm || selectedCategory !== "all" || selectedVendor !== "all" || selectedTimeSlot !== "all") && (
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedVendor("all");
                    setSelectedTimeSlot("all");
                  }}
                  className="text-black hover:underline font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.itemId}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-black text-lg mb-1 line-clamp-2">{item.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <ChefHat className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{item.shopName}</span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {item.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    {item.isSpecial && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Zap className="w-3 h-3 mr-1" />
                        Special
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 capitalize">{item.timeSlot}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-black text-lg">₹{item.price || item.basePrice}</div>
                      {item.price && item.price !== item.basePrice && (
                        <div className="text-sm text-gray-500 line-through">₹{item.basePrice}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FoodCourtDetails;