import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Tag,
  Calendar,
  Zap,
  Search,
} from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";
import type { ItemFoodCourtUpdatePayload } from "../../types/websocket";

interface Vendor {
  id: string;
  shopName: string;
  gst?: string;
  createdAt: string;
}

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
  timings?: string;
  createdAt: string;
}

interface ItemFoodCourtDetail {
  id: string;
  item_id: string;
  foodcourt_id: string;
  status: string;
  price?: number;
  timeSlot: string;
  isActive?: boolean;
  updatedAt?: string;

  item_name: string;
  item_description?: string;
  item_basePrice: number;
  item_category: string;
  item_isVeg: boolean;
  item_isSpecial: boolean;

  foodcourt_name: string;
  foodcourt_location: string;
  foodcourt_isOpen: boolean;
  foodcourt_timings?: string;
}

interface Summary {
  total_items: number;
  total_locations: number;
  available_items: number;
  selling_fast_items: number;
}

interface VendorProfileResponse {
  vendor: Vendor;
  item_foodcourt_details: ItemFoodCourtDetail[];
  foodCourts: FoodCourt[];
  summary: Summary;
}

interface ItemDisplay {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  createdAt: string;
  availability: ItemFoodCourtDetail[];
}

const VendorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext();
  const [data, setData] = useState<VendorProfileResponse | null>(null);
  const [itemsDisplay, setItemsDisplay] = useState<ItemDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"items" | "locations">("items");

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

  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as ItemFoodCourtUpdatePayload;
      console.log("🔄 Real-time update in VendorProfile:", update);

      setData((prev) => {
        if (!prev) return prev;

        const hasItemFoodCourt = prev.item_foodcourt_details.some(
          (detail) =>
            detail.item_id === update.item_id &&
            detail.foodcourt_id === update.foodcourt_id
        );

        if (!hasItemFoodCourt) return prev;

        return {
          ...prev,
          item_foodcourt_details: prev.item_foodcourt_details?.map((detail) =>
            detail.item_id === update.item_id &&
            detail.foodcourt_id === update.foodcourt_id
              ? {
                  ...detail,
                  status: update.status,
                  price: update.price,
                  timeSlot: update.timeSlot,
                  isActive: update.isActive,
                  updatedAt: update.updatedAt || new Date().toISOString(),
                }
              : detail
          ),
        };
      });
    }
  }, [lastMessage]);

  useEffect(() => {
    if (data && data.item_foodcourt_details) {
      const itemsMap = new Map<string, ItemDisplay>();

      data.item_foodcourt_details.forEach((detail) => {
        if (!itemsMap.has(detail.item_id)) {
          itemsMap.set(detail.item_id, {
            id: detail.item_id,
            name: detail.item_name,
            description: detail.item_description || "",
            basePrice: detail.item_basePrice,
            category: detail.item_category,
            isVeg: detail.item_isVeg,
            isSpecial: detail.item_isSpecial,
            createdAt: "",
            availability: [detail],
          });
        } else {
          const existingItem = itemsMap.get(detail.item_id)!;
          existingItem.availability.push(detail);
        }
      });

      setItemsDisplay(Array.from(itemsMap.values()));
    }
  }, [data]);

  useEffect(() => {
    if (id) {
      fetchVendorProfile();
    }
  }, [id]);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get(`/user/vendors/${id}`);
      setData(response.data.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ??
            err.message ??
            "Failed to load vendor profile"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredItems =
    itemsDisplay
      ?.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      ?.filter(
        (item) =>
          selectedCategory === "all" || item.category === selectedCategory
      ) || [];

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "sellingfast":
        return "Selling Fast";
      case "finishingsoon":
        return "Finishing Soon";
      case "notavailable":
        return "Not Available";
      default:
        return status;
    }
  };

  const getDisplayPrice = (
    item: ItemDisplay,
    availability: ItemFoodCourtDetail
  ) => {
    return availability.price !== undefined
      ? availability.price
      : item.basePrice;
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewAvailability = () => {
    navigate(`/user/vendors/${id}/availability`);
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
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)]?.map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200"
                >
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={fetchVendorProfile}
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-gray-600">Vendor not found</div>
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                <Store className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-black">
                    {data.vendor.shopName}
                  </h1>

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
                    {isConnected ? "Live" : "Connecting..."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Member since{" "}
                      {new Date(data.vendor.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {data.vendor.gst && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>GST: {data.vendor.gst}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {data.summary.total_items} Items
                  </div>
                  <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {data.summary.total_locations} Locations
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {data.summary.available_items} Available
                  </div>
                  {data.summary.selling_fast_items > 0 && (
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      {data.summary.selling_fast_items} Selling Fast
                    </div>
                  )}
                  <button
                    onClick={handleViewAvailability}
                    className="bg-black text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    View Availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-2 border-2 border-gray-200 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("items")}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === "items"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black hover:bg-gray-100"
              }`}
            >
              Menu Items ({data.summary.total_items})
            </button>
            <button
              onClick={() => setActiveTab("locations")}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === "locations"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black hover:bg-gray-100"
              }`}
            >
              Locations ({data.summary.total_locations})
            </button>
          </div>
        </div>

        {activeTab === "items" && (
          <>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none bg-white"
                  >
                    {categories?.map((category) => (
                      <option key={category} value={category}>
                        {category === "all"
                          ? "All Categories"
                          : category.charAt(0).toUpperCase() +
                            category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filteredItems?.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">
                  No items found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No items available from this vendor"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-gray-600">
                    {filteredItems?.length} item(s) found
                  </span>
                  {(searchTerm || selectedCategory !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("all");
                      }}
                      className="text-black hover:underline font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Link to={`/user/item/${item.id}`}>
                          <h3 className="font-bold text-black text-lg line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                      </div>

                      {item.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.isVeg
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {item.category}
                        </span>
                        {item.isSpecial && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Zap className="w-3 h-3 mr-1" />
                            Special
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            Available at:
                          </span>
                        </div>
                        <div className="space-y-1">
                          {item.availability.slice(0, 2)?.map((avail) => (
                            <div
                              key={avail.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-600 truncate">
                                {avail.foodcourt_name}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`px-2 py-1 rounded-full ${getStatusColor(
                                    avail.status
                                  )}`}
                                >
                                  {getStatusText(avail.status)}
                                </span>
                                <span className="text-black font-medium">
                                  ₹{getDisplayPrice(item, avail)}
                                </span>
                              </div>
                            </div>
                          ))}
                          {item.availability?.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{item.availability?.length - 2} more locations
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Base price: ₹{item.basePrice}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">
                            Available at {item.availability?.length} location(s)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "locations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.foodCourts?.map((foodCourt) => (
              <div
                key={foodCourt.id}
                onClick={() => handleFoodCourtClick(foodCourt.id)}
                className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg hover:border-black transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-black text-lg mb-1">
                      {foodCourt.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {foodCourt.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      foodCourt.isOpen ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      foodCourt.isOpen ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {foodCourt.isOpen ? "Open Now" : "Closed"}
                  </span>
                </div>

                {foodCourt.timings && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{foodCourt.timings}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">
                    Vendor items available here
                  </div>
                  <div className="text-xs text-gray-500">
                    {
                      data.item_foodcourt_details?.filter(
                        (detail) => detail.foodcourt_id === foodCourt.id
                      )?.length
                    }{" "}
                    items
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProfile;
