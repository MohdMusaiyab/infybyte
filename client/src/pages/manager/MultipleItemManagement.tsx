import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { 
  Package, 
  Store, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Check,
} from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext"; // ✅ ADDED

interface FoodCourt {
  _id: string;
  name: string;
  location: string;
}

interface FoodCourtStatus {
  foodCourtId: string;
  foodCourtName: string;
  location: string;
  isInFoodCourt: boolean;
}

interface VendorItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  createdAt: string;
  foodCourtStatus: FoodCourtStatus[];
  canManage: boolean;
}

interface ApiResponse {
  items: VendorItem[];
  foodCourts: FoodCourt[];
  stats: {
    totalItems: number;
    totalFoodCourts: number;
    vendorId: string;
  };
}

// ✅ ADDED: WebSocket message interface
interface WebSocketUpdatePayload {
  id: string;
  item_id: string;
  foodcourt_id: string;
  status: "available" | "notavailable" | "sellingfast" | "finishingsoon";
  price?: number;
  isActive: boolean;
  timeSlot: "breakfast" | "lunch" | "snacks" | "dinner";
  createdAt: string;
  updatedAt: string;
}

const MultipleItemManagement: React.FC = () => {
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext(); // ✅ ADDED: WebSocket hook
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFoodCourt, setSelectedFoodCourt] = useState<string>("all");
  const [addingItems, setAddingItems] = useState<{[key: string]: string}>({}); // itemId -> foodCourtId
  const [successMessage, setSuccessMessage] = useState<string>("");

  // ✅ ADDED: WebSocket handler without loops
  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as WebSocketUpdatePayload;
      const action = lastMessage.action;
      
      console.log("🔄 Real-time update in MultipleItemManagement:", { update, action });

      if (action === "create" || action === "update" || action === "delete") {
        // Refresh data to get the latest state
        const refreshData = async () => {
          try {
            const response = await axiosInstance.get("/manager/vendor-items");
            setData(response.data.data);
            console.log("✅ Data refreshed via WebSocket");
          } catch (err) {
            console.error("Failed to refresh data:", err);
          }
        };
        
        refreshData();
      }
    }
  }, [lastMessage]); // ✅ Only depend on lastMessage to avoid loops

  useEffect(() => {
    const fetchVendorItems = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await axiosInstance.get("/manager/vendor-items");
        setData(response.data.data);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          const responseData = err.response?.data as { message?: string } | undefined;
          setError(responseData?.message ?? err.message ?? "Failed to load vendor items");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVendorItems();
  }, []);

  const handleQuickAdd = async (itemId: string, foodCourtId: string, foodCourtName: string) => {
    try {
      setAddingItems(prev => ({...prev, [itemId]: foodCourtId}));
      
      await axiosInstance.post(`/manager/items/${itemId}/foodcourt`, {
        foodCourtId,
        status: "available",
        price: undefined, // Use base price
        timeSlot: "lunch"
      });

      // Refresh data
      const response = await axiosInstance.get("/manager/vendor-items");
      setData(response.data.data);
      setSuccessMessage(`Item added to ${foodCourtName} successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        alert(responseData?.message ?? "Failed to add item to food court");
      } else {
        alert("Failed to add item to food court");
      }
    } finally {
      setAddingItems(prev => {
        const newState = {...prev};
        delete newState[itemId];
        return newState;
      });
    }
  };

  // Filter items based on search and filters
  const filteredItems = data?.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    const matchesFoodCourt = selectedFoodCourt === "all" || 
      item.foodCourtStatus.some(status => 
        status.foodCourtId === selectedFoodCourt && status.isInFoodCourt
      );

    return matchesSearch && matchesCategory && matchesFoodCourt;
  });

  // Get unique categories
  const categories = [...new Set(data?.items.map(item => item.category) || [])];

  const getStatusColor = (isInFC: boolean) => {
    return isInFC ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusDisplay = (isInFC: boolean) => {
    return isInFC ? "Added" : "Not Added";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading vendor items...</div>
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
            onClick={() => window.location.reload()}
            className="w-full bg-black text-white px-4 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with WebSocket status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-black">Vendor Items Management</h1>
            {/* ✅ ADDED: WebSocket connection status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {isConnected ? 'Live Updates' : 'Connecting...'}
            </div>
          </div>
          <p className="text-gray-600">
            Manage item distribution across your food courts
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border-2 border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Stats and Filters */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{data?.stats.totalItems || 0}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{data?.stats.totalFoodCourts || 0}</div>
                <div className="text-sm text-gray-600">Food Courts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black">
                  {data?.items.filter(item => 
                    item.foodCourtStatus.some(status => status.isInFoodCourt)
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-600">Active in FCs</div>
              </div>
            </div>

            <button
              onClick={() => navigate("/manager/dashboard")}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Food Court Filter */}
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedFoodCourt}
                onChange={(e) => setSelectedFoodCourt(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 appearance-none bg-white"
              >
                <option value="all">All Food Courts</option>
                {data?.foodCourts.map(fc => (
                  <option key={fc._id} value={fc._id}>
                    {fc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedFoodCourt("all");
              }}
              className="bg-white text-black px-6 py-3 rounded-xl border-2 border-black hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems?.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300">
              {/* Item Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-black text-lg mb-2 line-clamp-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description || "No description available"}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  item.isVeg ? "border-green-500" : "border-red-500"
                }`}>
                  <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                    item.isVeg ? "bg-green-500" : "bg-red-500"
                  }`} />
                </div>
              </div>

              {/* Item Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-black capitalize">{item.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium text-black">₹{item.basePrice}</span>
                </div>
                {item.isSpecial && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Special:</span>
                    <span className="font-medium text-yellow-600">Yes</span>
                  </div>
                )}
              </div>

              {/* Food Court Status */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Food Court Status
                </h4>
                
                <div className="space-y-2">
                  {item.foodCourtStatus.map((status) => (
                    <div key={status.foodCourtId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-black">{status.foodCourtName}</div>
                        <div className="text-xs text-gray-500">{status.location}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(status.isInFoodCourt)}`}>
                          {getStatusDisplay(status.isInFoodCourt)}
                        </div>
                        
                        {!status.isInFoodCourt && (
                          <button
                            onClick={() => handleQuickAdd(item.id, status.foodCourtId, status.foodCourtName)}
                            disabled={addingItems[item.id] === status.foodCourtId}
                            className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                          >
                            {addingItems[item.id] === status.foodCourtId ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => navigate(`/manager/item-management/${item.id}`)}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-xl border-2 border-black hover:bg-gray-50 transition-colors font-medium"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems?.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No items found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || selectedCategory !== "all" || selectedFoodCourt !== "all" 
                ? "Try adjusting your filters" 
                : "No items available from vendor"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultipleItemManagement;