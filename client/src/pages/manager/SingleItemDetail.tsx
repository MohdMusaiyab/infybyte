import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, Save, RotateCcw, DollarSign } from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";


interface FoodCourt {
  id: string;
  name: string;
  location: string;
}

interface KeyValuePair {
  Key: string;
  Value: string | number | boolean | null;
}

interface ItemDetails {
  _id: string;
  item_id: string;
  status: "available" | "notavailable" | "sellingfast" | "finishingsoon";
  price: number | null;
  isActive: boolean;
  timeSlot: "breakfast" | "lunch" | "snacks" | "dinner";
  name: string;
  description: string;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
}

interface UpdateData {
  status?: "available" | "notavailable" | "sellingfast" | "finishingsoon";
  price?: number | null;
  isActive?: boolean;
  timeSlot?: "breakfast" | "lunch" | "snacks" | "dinner";
}

interface FormData {
  status: "available" | "notavailable" | "sellingfast" | "finishingsoon";
  price: string;
  isActive: boolean;
  timeSlot: "breakfast" | "lunch" | "snacks" | "dinner";
}

const SingleItemDetail: React.FC = () => {
  const { foodCourtId, itemId } = useParams<{ foodCourtId: string; itemId: string }>();
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext();
  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<FormData>({
    status: "available",
    price: "",
    isActive: true,
    timeSlot: "breakfast"
  });

  // ✅ FIXED: WebSocket updates without causing loops
  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as any;
      const action = lastMessage.action;
      
      console.log("🔄 Real-time update received in SingleItemDetail:", { update, action });

      if (action === "update") {
        // Check if this update is relevant for the current item
        const isCurrentItem = 
          update.id === item?._id || 
          (update.item_id === itemId && update.foodcourt_id === foodCourtId);
        
        if (isCurrentItem) {
          console.log("✅ Updating current item with real-time data");
          
          // ✅ FIX: Only update if the values are actually different to avoid loops
          setItem(prev => {
            if (!prev) return prev;
            
            const hasChanges = 
              prev.status !== update.status ||
              prev.price !== update.price ||
              prev.timeSlot !== update.timeSlot ||
              prev.isActive !== update.isActive;
              
            if (!hasChanges) return prev;
            
            return {
              ...prev,
              status: update.status,
              price: update.price,
              timeSlot: update.timeSlot,
              isActive: update.isActive,
              updatedAt: update.updatedAt
            };
          });

          // ✅ FIX: Only update formData if user hasn't made local changes
          setFormData(prev => {
            const hasLocalChanges = 
              prev.status !== item?.status ||
              prev.price !== (item?.price?.toString() || "") ||
              prev.timeSlot !== item?.timeSlot ||
              prev.isActive !== item?.isActive;
              
            // Don't overwrite form data if user is actively editing
            if (hasLocalChanges) {
              console.log("📝 User has local changes, not overwriting form");
              return prev;
            }
            
            return {
              status: update.status,
              price: update.price ? update.price.toString() : "",
              isActive: update.isActive,
              timeSlot: update.timeSlot
            };
          });
        }
      }
    }
  }, [lastMessage, itemId, foodCourtId]); // ✅ REMOVED: 'item' from dependencies to break the loop

  // Helper function to convert key-value array to object
  const transformItemData = (itemArray: KeyValuePair[]): ItemDetails => {
    const itemObj: Record<string, string | number | boolean | null> = {};
    itemArray.forEach(pair => {
      itemObj[pair.Key] = pair.Value;
    });
    return itemObj as unknown as ItemDetails;
  };

  useEffect(() => {
    const fetchItemData = async () => {
      if (!foodCourtId || !itemId) return;

      try {
        setLoading(true);
        setError("");
        
        const response = await axiosInstance.get(`/manager/foodcourts/${foodCourtId}/items/${itemId}`);
        const data = response.data.data;
        
        setFoodCourt(data.foodCourt);
        
        const transformedItem = transformItemData(data.item);
        setItem(transformedItem);
        
        setFormData({
          status: transformedItem.status || "available",
          price: transformedItem.price ? transformedItem.price.toString() : "",
          isActive: transformedItem.isActive !== undefined ? transformedItem.isActive : true,
          timeSlot: transformedItem.timeSlot || "breakfast"
        });

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

    fetchItemData();
  }, [foodCourtId, itemId]);

  // Form handlers
  const handleStatusChange = (status: FormData["status"]) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handlePriceChange = (price: string) => {
    const numericValue = price.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    setFormData(prev => ({ ...prev, price: finalValue }));
  };

  const handleTimeSlotChange = (timeSlot: FormData["timeSlot"]) => {
    setFormData(prev => ({ ...prev, timeSlot }));
  };

  const handleActiveChange = (isActive: boolean) => {
    setFormData(prev => ({ ...prev, isActive }));
  };

  const handleSave = async () => {
    if (!itemId || !item) return;

    try {
      setSaving(true);
      
      const updateData: UpdateData = {};
      
      if (formData.status !== item.status) {
        updateData.status = formData.status;
      }
      
      const currentPrice = formData.price ? parseFloat(formData.price) : null;
      if (currentPrice !== item.price) {
        updateData.price = currentPrice;
      }
      
      if (formData.isActive !== item.isActive) {
        updateData.isActive = formData.isActive;
      }
      
      if (formData.timeSlot !== item.timeSlot) {
        updateData.timeSlot = formData.timeSlot;
      }

      if (Object.keys(updateData).length > 0) {
        await axiosInstance.put(`/manager/foodcourt/item/${itemId}`, updateData);
        
        // Update local state
        const updatedItem = {
          ...item,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        setItem(updatedItem);
        
        alert("Item updated successfully!");
      } else {
        alert("No changes to save.");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        alert(responseData?.message ?? "Failed to update item");
        
        // Revert form data on error
        if (item) {
          setFormData({
            status: item.status,
            price: item.price ? item.price.toString() : "",
            isActive: item.isActive,
            timeSlot: item.timeSlot
          });
        }
      } else {
        alert("Failed to update item");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (item) {
      setFormData({
        status: item.status,
        price: item.price ? item.price.toString() : "",
        isActive: item.isActive,
        timeSlot: item.timeSlot
      });
    }
  };

  const hasChanges = () => {
    if (!item) return false;
    
    const currentPrice = formData.price ? parseFloat(formData.price) : null;
    const priceChanged = currentPrice !== item.price;
    
    return formData.status !== item.status ||
           priceChanged ||
           formData.isActive !== item.isActive ||
           formData.timeSlot !== item.timeSlot;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 border-green-200";
      case "notavailable": return "bg-red-100 text-red-800 border-red-200";
      case "sellingfast": return "bg-orange-100 text-orange-800 border-orange-200";
      case "finishingsoon": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "notavailable": return "Not Available";
      case "sellingfast": return "Selling Fast";
      case "finishingsoon": return "Finishing Soon";
      default: return status;
    }
  };

  const getTimeSlotDisplay = (timeSlot: string) => {
    switch (timeSlot) {
      case "breakfast": return "Breakfast";
      case "lunch": return "Lunch";
      case "snacks": return "Snacks";
      case "dinner": return "Dinner";
      default: return timeSlot;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading item details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 max-w-md w-full">
          <div className="text-black font-bold text-lg mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-black text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Food Court
          </button>
          
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">{item?.name}</h1>
                <p className="text-gray-600 mb-4">{foodCourt?.name} • {foodCourt?.location}</p>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(formData.status)}`}>
                    {getStatusDisplay(formData.status)}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    item?.isVeg ? "border-green-500 text-green-700 bg-green-50" : "border-red-500 text-red-700 bg-red-50"
                  }`}>
                    {item?.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                  </div>
                  {item?.isSpecial && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium border border-yellow-500 text-yellow-700 bg-yellow-50">
                      Special Item
                    </div>
                  )}
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
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-black mb-1">
                  ₹{formData.price || item?.basePrice}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.price ? "Custom Price" : "Base Price"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Item Details and Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Read-only Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-black mb-4">Item Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-black mt-1">{item?.description || "No description available"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="text-black mt-1 capitalize">{item?.category}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Base Price</label>
                  <p className="text-black mt-1">₹{item?.basePrice}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-black mt-1">{new Date(item?.createdAt || "").toLocaleDateString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-black mt-1">{new Date(item?.updatedAt || "").toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-black mb-6">Manage Item in Food Court</h2>
              
              <div className="space-y-6">
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Availability Status</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {["available", "notavailable", "sellingfast", "finishingsoon"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(status as FormData["status"])}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                          formData.status === status
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {getStatusDisplay(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Court Specific Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder={`Base price: ₹${item?.basePrice}`}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-colors"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to use base price (₹{item?.basePrice})
                  </p>
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Time Slot</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {["breakfast", "lunch", "snacks", "dinner"].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleTimeSlotChange(slot as FormData["timeSlot"])}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                          formData.timeSlot === slot
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {getTimeSlotDisplay(slot)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Active</label>
                    <p className="text-sm text-gray-500">Show or hide this item in the food court</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleActiveChange(!formData.isActive)}
                    className={`relative inline-flex items-center w-14 h-8 rounded-full transition-colors ${
                      formData.isActive ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform ${
                        formData.isActive ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges() || saving}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium flex-1 justify-center"
                  >
                    {saving ? (
                      <RotateCcw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges()}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl border-2 border-black hover:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleItemDetail;