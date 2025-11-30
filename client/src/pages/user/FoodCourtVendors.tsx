import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, ChefHat, MapPin, Clock, Search, Heart, Zap, Users } from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";
import type { ItemFoodCourtUpdatePayload } from "../../types/websocket";

interface VendorItem {
  vendorId: string;
  shopName: string;
  items: Array<{
    itemId: string;
    name: string;
    description: string;
    basePrice: number;
    category: string;
    isVeg: boolean;
    isSpecial: boolean;
    status: string;
    price?: number;
    timeSlot: string;
  }>;
}

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  timings: string;
  isOpen: boolean;
  weekends: boolean;
  weekdays: boolean;
}

const FoodCourtVendors: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext();
  const [vendorItems, setVendorItems] = useState<VendorItem[]>([]);
  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("all");
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const categories = ["all", "breakfast", "maincourse", "dessert", "beverage", "dosa", "northmeal", "paratha", "chinese", "combo"];
  const timeSlots = ["all", "breakfast", "lunch", "snacks", "dinner"];

  // WebSocket real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as ItemFoodCourtUpdatePayload;
      
      console.log("🔄 Real-time update in FoodCourtVendors:", update);

      setVendorItems(prev => 
        prev.map(vendor => ({
          ...vendor,
          items: vendor.items.map(item => 
            item.itemId === update.item_id 
              ? {
                  ...item,
                  status: update.status,
                  price: update.price,
                  timeSlot: update.timeSlot,
                  isActive: update.isActive
                }
              : item
          )
        }))
      );
    }
  }, [lastMessage]);

  useEffect(() => {
    if (id) {
      fetchFoodCourtVendors();
      fetchFoodCourtDetails();
    }
  }, [id]);

  const fetchFoodCourtVendors = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get(`/user/foodcourts/${id}/items`);
      
      // Handle both response formats
      let itemsData = response.data.data || [];
      
      // If items are in key-value pair format, transform them
      if (itemsData.length > 0 && Array.isArray(itemsData[0].items) && itemsData[0].items.length > 0) {
        const isKeyValueFormat = Array.isArray(itemsData[0].items[0]) && itemsData[0].items[0][0]?.Key;
        
        if (isKeyValueFormat) {
          itemsData = itemsData.map((vendor: any) => ({
            ...vendor,
            items: vendor.items.map((itemArray: any[]) => {
              const itemObj: any = {};
              itemArray.forEach(({ Key, Value }: { Key: string; Value: any }) => {
                itemObj[Key] = Value;
              });
              return itemObj;
            })
          }));
        }
      }
      
      setVendorItems(itemsData);
      
      // Expand first vendor by default
      if (itemsData.length > 0) {
        setExpandedVendors(new Set([itemsData[0].vendorId]));
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load vendors and items");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodCourtDetails = async () => {
    try {
      const response = await axiosInstance.get(`/user/foodcourts/${id}`);
      setFoodCourt(response.data.data.foodCourt);
    } catch (err) {
      console.error("Failed to load food court details:", err);
    }
  };

  const toggleVendor = (vendorId: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const expandAllVendors = () => {
    const allVendorIds = new Set(vendorItems.map(v => v.vendorId));
    setExpandedVendors(allVendorIds);
  };

  const collapseAllVendors = () => {
    setExpandedVendors(new Set());
  };

  const filteredVendorItems = vendorItems.map(vendor => ({
    ...vendor,
    items: vendor.items.filter(item =>
      item?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      item?.description?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      vendor?.shopName?.toLowerCase().includes(searchTerm?.toLowerCase())
    ).filter(item =>
      selectedCategory === "all" || item.category === selectedCategory
    ).filter(item =>
      selectedTimeSlot === "all" || item.timeSlot === selectedTimeSlot
    )
  })).filter(vendor => vendor.items.length > 0);

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
    navigate(`/user/foodcourt/${id}`);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <div key={j} className="h-16 bg-gray-200 rounded-xl"></div>
                    ))}
                  </div>
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={fetchFoodCourtVendors}
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

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Food Court
          </button>
          
          <div className="flex items-center justify-between">
            {foodCourt && (
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-black">{foodCourt.name} - Vendors</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{foodCourt.location}</span>
                    </div>
                  </div>
                  <div className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                    foodCourt.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {foodCourt.isOpen ? 'Open Now' : 'Closed'}
                  </div>
                </div>
              </div>
            )}
            {/* WebSocket Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ml-4 ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {isConnected ? 'Live' : 'Connecting...'}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendors or items..."
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
          </div>

          {/* Time Slot Filter */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {timeSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedTimeSlot === slot
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                  }`}
                >
                  {slot === "all" ? "All Times" : slot.charAt(0).toUpperCase() + slot.slice(1)}
                </button>
              ))}
            </div>

            {/* Expand/Collapse All */}
            <div className="flex gap-2">
              <button
                onClick={expandAllVendors}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-black text-sm font-medium transition-all duration-300"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllVendors}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-black text-sm font-medium transition-all duration-300"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-600">
            {filteredVendorItems.length} vendor(s) • {filteredVendorItems.reduce((acc, vendor) => acc + vendor.items.length, 0)} item(s)
          </span>
          {(searchTerm || selectedCategory !== "all" || selectedTimeSlot !== "all") && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedTimeSlot("all");
              }}
              className="text-black hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Vendors List */}
        {filteredVendorItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">No vendors found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== "all" || selectedTimeSlot !== "all"
                ? "Try adjusting your search or filter criteria" 
                : "No vendors available in this food court"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVendorItems.map((vendor) => (
              <div key={vendor.vendorId} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                {/* Vendor Header */}
                <button
                  onClick={() => toggleVendor(vendor.vendorId)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black text-lg">{vendor.shopName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{vendor.items.length} item(s)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {expandedVendors.has(vendor.vendorId) ? 'Collapse' : 'Expand'}
                    </span>
                    <div className={`transform transition-transform duration-300 ${
                      expandedVendors.has(vendor.vendorId) ? 'rotate-180' : ''
                    }`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Vendor Items */}
                {expandedVendors.has(vendor.vendorId) && (
                  <div className="border-t border-gray-200">
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendor.items.map((item) => (
                          <div
                            key={item.itemId}
                            className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-bold text-black text-sm line-clamp-2">{item.name}</h4>
                              <button className="p-1 hover:bg-white rounded transition-colors">
                                <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>

                            {item.description && (
                              <p className="text-gray-600 text-xs line-clamp-2 mb-3">{item.description}</p>
                            )}

                            <div className="flex flex-wrap gap-1 mb-3">
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

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-600 capitalize">{item.timeSlot}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-black">₹{item.price || item.basePrice}</div>
                                {item.price && item.price !== item.basePrice && (
                                  <div className="text-xs text-gray-500 line-through">₹{item.basePrice}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodCourtVendors;