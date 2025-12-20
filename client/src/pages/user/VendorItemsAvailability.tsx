import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Tag,
} from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";
import type { ItemFoodCourtUpdatePayload } from "../../types/websocket";

interface FoodCourtAvailability {
  foodCourtId: string;
  foodCourtName: string;
  location: string;
  status: string;
  price?: number;
  timeSlot: string;
  isActive: boolean;
}

interface VendorItem {
  itemId: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  foodCourts: FoodCourtAvailability[];
}

const VendorItemsAvailability: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext();
  const [items, setItems] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFoodCourt, setSelectedFoodCourt] = useState<string>("all");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const categories = [
    "all",
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
  const timeSlots = ["all", "breakfast", "lunch", "snacks", "dinner"];

  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as ItemFoodCourtUpdatePayload;

      console.log("🔄 Real-time update in VendorItemsAvailability:", update);

      setItems((prev) =>
        prev.map((item) =>
          item.itemId === update.item_id
            ? {
                ...item,
                foodCourts: item.foodCourts.map((fc) =>
                  fc.foodCourtId === update.foodcourt_id
                    ? {
                        ...fc,
                        status: update.status,
                        price: update.price,
                        timeSlot: update.timeSlot,
                        isActive: update.isActive,
                      }
                    : fc
                ),
              }
            : item
        )
      );
    }
  }, [lastMessage]);

  useEffect(() => {
    if (id) {
      fetchVendorItems();
    }
  }, [id]);

  const fetchVendorItems = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get(`/user/vendors/${id}/items`);
      setItems(response.data.data || []);

      // Expand first item by default if items exist
      if (response.data.data && response.data.data.length > 0) {
        setExpandedItems(new Set([response.data.data[0].itemId]));
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to load vendor items"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Safe string methods
  const safeToLowerCase = (str: string | undefined): string => {
    return (str || "").toLowerCase();
  };

  const safeIncludes = (str: string | undefined, search: string): boolean => {
    return safeToLowerCase(str || "").includes(safeToLowerCase(search));
  };

  // Get unique food courts from all items
  const allFoodCourts = Array.from(
    new Set(
      items.flatMap((item) =>
        (item.foodCourts || []).map((fc) => ({
          id: fc.foodCourtId,
          name: fc.foodCourtName,
          location: fc.location,
        }))
      )
    )
  );

  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        safeIncludes(item.name, searchTerm) ||
        safeIncludes(item.description, searchTerm);

      const matchesCategory =
        selectedCategory === "all" ||
        (item.category && item.category === selectedCategory);

      return matchesSearch && matchesCategory;
    })
    .map((item) => ({
      ...item,
      foodCourts: (item.foodCourts || []).filter((fc) => {
        const matchesFoodCourt =
          selectedFoodCourt === "all" || fc.foodCourtId === selectedFoodCourt;

        const matchesTimeSlot =
          selectedTimeSlot === "all" ||
          (fc.timeSlot && fc.timeSlot === selectedTimeSlot);

        const isActive = fc.isActive !== false; // Default to true if undefined

        return matchesFoodCourt && matchesTimeSlot && isActive;
      }),
    }))
    .filter((item) => (item.foodCourts || []).length > 0);

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const expandAllItems = () => {
    const allItemIds = new Set(filteredItems.map((item) => item.itemId));
    setExpandedItems(allItemIds);
  };

  const collapseAllItems = () => {
    setExpandedItems(new Set());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "sellingfast":
        return "bg-orange-100 text-orange-800";
      case "finishingsoon":
        return "bg-yellow-100 text-yellow-800";
      case "notavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleBack = () => {
    navigate(`/user/vendors/${id}`);
  };

  const handleFoodCourtClick = (foodCourtId: string) => {
    navigate(`/user/foodcourt/${foodCourtId}`);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200"
                >
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, j) => (
                      <div
                        key={j}
                        className="h-16 bg-gray-200 rounded-xl"
                      ></div>
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={fetchVendorItems}
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
      <div className="max-w-6xl mx-auto">
        {/* Header with WebSocket status */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Vendor Profile
          </button>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">
                  Item Availability
                </h1>
                <p className="text-gray-600">
                  See where each item is available across different food courts
                </p>
              </div>
              {/* WebSocket Status */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-yellow-500"
                  }`}
                ></div>
                {isConnected ? "Live Updates" : "Connecting..."}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
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
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all"
                      ? "All Categories"
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Food Court Filter */}
            <div>
              <select
                value={selectedFoodCourt}
                onChange={(e) => setSelectedFoodCourt(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
              >
                <option value="all">All Food Courts</option>
                {allFoodCourts.map((fc) => (
                  <option key={fc.id} value={fc.id}>
                    {<Link to={`/user/foodcourt/${fc.id}`}>{fc.name}</Link>}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Time Slot Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    selectedTimeSlot === slot
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-200 hover:border-black"
                  }`}
                >
                  {slot === "all"
                    ? "All Times"
                    : slot.charAt(0).toUpperCase() + slot.slice(1)}
                </button>
              ))}
            </div>

            {/* Expand/Collapse All */}
            <div className="flex gap-2">
              <button
                onClick={expandAllItems}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-black text-sm font-medium transition-all duration-300"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllItems}
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
            {filteredItems.length} item(s) •{" "}
            {filteredItems.reduce(
              (acc, item) => acc + (item.foodCourts?.length || 0),
              0
            )}{" "}
            location(s)
          </span>
          {(searchTerm ||
            selectedCategory !== "all" ||
            selectedFoodCourt !== "all" ||
            selectedTimeSlot !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedFoodCourt("all");
                setSelectedTimeSlot("all");
              }}
              className="text-black hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              No items found
            </h3>
            <p className="text-gray-600">
              {searchTerm ||
              selectedCategory !== "all" ||
              selectedFoodCourt !== "all" ||
              selectedTimeSlot !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No items available with current filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.itemId}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden"
              >
                {/* Item Header */}
                <button
                  onClick={() => toggleItem(item.itemId)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <Link to={`/user/item/${item.itemId}`}>
                        <h3 className="font-bold text-black text-lg mb-1">
                          {item.name || "Unnamed Item"}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-medium">
                          ₹{item.basePrice || 0}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.isVeg
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 capitalize">
                          {item.category || "Uncategorized"}
                        </span>
                        {item.isSpecial && (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Special
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2 max-w-2xl">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {item.foodCourts?.length || 0} location(s)
                    </span>
                    {expandedItems.has(item.itemId) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Food Court Availability */}
                {expandedItems.has(item.itemId) &&
                  item.foodCourts &&
                  item.foodCourts.length > 0 && (
                    <div className="border-t border-gray-200">
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.foodCourts.map((fc, index) => (
                            <div
                              key={`${fc.foodCourtId}-${index}`}
                              onClick={() =>
                                handleFoodCourtClick(fc.foodCourtId)
                              }
                              className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-black text-sm mb-1">
                                    {fc.foodCourtName || "Unknown Food Court"}
                                  </h4>
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <MapPin className="w-3 h-3" />
                                    <span>
                                      {fc.location || "Unknown Location"}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    fc.status
                                  )}`}
                                >
                                  {fc.status || "unknown"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-600 capitalize">
                                    {fc.timeSlot || "unknown"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-black">
                                    ₹
                                    {fc.price !== undefined
                                      ? fc.price
                                      : item.basePrice}
                                  </div>
                                  {fc.price !== undefined &&
                                    fc.price !== item.basePrice && (
                                      <div className="text-gray-500 line-through text-xs">
                                        ₹{item.basePrice}
                                      </div>
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

export default VendorItemsAvailability;
