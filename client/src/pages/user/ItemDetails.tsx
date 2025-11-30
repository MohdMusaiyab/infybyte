import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, ChefHat, MapPin, Clock, Zap, Tag, Calendar, Heart, ShoppingBag } from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";
import type { ItemFoodCourtUpdatePayload } from "../../types/websocket";

interface Item {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Vendor {
  id: string;
  shopName: string;
  gst?: string;
}

interface Availability {
  foodCourtId: string;
  foodCourtName: string;
  location: string;
  timings: string;
  isOpen: boolean;
  weekends: boolean;
  weekdays: boolean;
  status: string;
  price?: number;
  timeSlot: string;
  isActive: boolean;
  updatedAt: string;
}

interface ItemDetailsResponse {
  item: Item;
  vendor: Vendor;
  availability: Availability[];
}

const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext();
  const [data, setData] = useState<ItemDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("all");

  const timeSlots = ["all", "breakfast", "lunch", "snacks", "dinner"];

  // WebSocket real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as ItemFoodCourtUpdatePayload;
      
      console.log("🔄 Real-time update in ItemDetails:", update);

      setData(prev => {
        if (!prev) return prev;

        // Check if this is the same item
        if (prev.item.id !== update.item_id) return prev;

        return {
          ...prev,
          availability: prev.availability.map(avail => 
            avail.foodCourtId === update.foodcourt_id
              ? {
                  ...avail,
                  status: update.status,
                  price: update.price,
                  timeSlot: update.timeSlot,
                  isActive: update.isActive,
                  updatedAt: new Date().toISOString()
                }
              : avail
          )
        };
      });
    }
  }, [lastMessage]);

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get(`/user/items/${id}`);
      
      // Transform the API response to ensure availability is always an array
      const apiData = response.data.data;
      const transformedData: ItemDetailsResponse = {
        item: apiData.item,
        vendor: apiData.vendor,
        availability: Array.isArray(apiData.availability) ? apiData.availability : []
      };
      
      setData(transformedData);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load item details");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailability = data?.availability.filter(avail =>
    selectedTimeSlot === "all" || avail.timeSlot === selectedTimeSlot
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

  const getTimeSlotColor = (timeSlot: string) => {
    switch (timeSlot) {
      case "breakfast": return "bg-blue-100 text-blue-800";
      case "lunch": return "bg-green-100 text-green-800";
      case "snacks": return "bg-orange-100 text-orange-800";
      case "dinner": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleVendorClick = (vendorId: string) => {
    navigate(`/user/vendors/${vendorId}`);
  };

  const handleFoodCourtClick = (foodCourtId: string) => {
    navigate(`/user/foodcourt/${foodCourtId}`);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={fetchItemDetails}
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-gray-600">Item not found</div>
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </div>

        {/* Item Header */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-black mb-2">{data.item.name}</h1>
                  <p className="text-gray-600 text-lg">{data.item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* WebSocket Status */}
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    {isConnected ? 'Live' : 'Connecting...'}
                  </div>
                  <button className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
                    <Heart className="w-6 h-6 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Item Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  data.item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                  <Tag className="w-4 h-4 mr-1" />
                  {data.item.category}
                </span>
                {data.item.isSpecial && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Zap className="w-4 h-4 mr-1" />
                    Special Item
                  </span>
                )}
              </div>

              {/* Vendor Info */}
              <div 
                onClick={() => handleVendorClick(data.vendor.id)}
                className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl hover:border-black transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-black">{data.vendor.shopName}</div>
                  <div className="text-sm text-gray-600">View Vendor Profile →</div>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 min-w-64">
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-2">Base Price</div>
                <div className="text-4xl font-bold text-black mb-4">₹{data.item.basePrice}</div>
                <div className="text-sm text-gray-600 mb-4">
                  Available at {data.availability.length} location(s)
                </div>
                <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Add to Favorites
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-2">Where to Find</h2>
              <p className="text-gray-600">Available at these food courts</p>
            </div>
            
            {/* Time Slot Filter */}
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
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-600">
              {filteredAvailability.length} location(s) found
            </span>
            {selectedTimeSlot !== "all" && (
              <button 
                onClick={() => setSelectedTimeSlot("all")}
                className="text-black hover:underline font-medium"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Availability Grid */}
          {filteredAvailability.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">No locations found</h3>
              <p className="text-gray-600">
                {selectedTimeSlot !== "all" 
                  ? "No availability for selected time slot" 
                  : "This item is not currently available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAvailability.map((avail) => (
                <div
                  key={avail.foodCourtId}
                  onClick={() => handleFoodCourtClick(avail.foodCourtId)}
                  className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 cursor-pointer group"
                >
                  {/* Food Court Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-black text-lg mb-1">{avail.foodCourtName}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{avail.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(avail.status)}`}>
                        {avail.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeSlotColor(avail.timeSlot)}`}>
                        {avail.timeSlot}
                      </span>
                    </div>
                  </div>

                  {/* Food Court Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Price</span>
                      <span className="font-bold text-black text-lg">
                        ₹{avail.price !== undefined ? avail.price : data.item.basePrice}
                      </span>
                    </div>
                    {avail.price !== undefined && avail.price !== data.item.basePrice && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Base Price</span>
                        <span className="text-gray-500 line-through">₹{data.item.basePrice}</span>
                      </div>
                    )}
                  </div>

                  {/* Food Court Status */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${avail.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={avail.isOpen ? 'text-green-600' : 'text-red-600'}>
                        {avail.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{avail.timings}</span>
                    </div>
                  </div>

                  {/* Operating Days */}
                  <div className="flex gap-2 mt-3 text-xs text-gray-500">
                    {avail.weekdays && <span>Weekdays</span>}
                    {avail.weekends && <span>Weekends</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item Stats */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">Item Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium text-black capitalize">{data.item.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Dietary</span>
                <span className={`font-medium ${data.item.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                  {data.item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Special Item</span>
                <span className={`font-medium ${data.item.isSpecial ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {data.item.isSpecial ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Added On</div>
                  <div className="font-medium text-black">
                    {new Date(data.item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="font-medium text-black">
                    {new Date(data.item.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;