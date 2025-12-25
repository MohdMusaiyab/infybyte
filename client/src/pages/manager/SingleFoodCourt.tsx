import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { ArrowLeft, Store, Package, Clock, MapPin, Edit } from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
  timings?: string;
}

interface FoodCourtItem {
  _id: string;
  item_id: string;
  status: "available" | "notavailable" | "sellingfast" | "finishingsoon";
  price?: number;
  isActive: boolean;
  timeSlot: "breakfast" | "lunch" | "snacks" | "dinner";
  name: string;
  description?: string;
  category: string;
  isVeg: boolean;
  basePrice: number;
}

interface KeyValuePair {
  Key: string;
  Value: string | number | boolean | null | undefined;
}

const SingleFoodCourt: React.FC = () => {
  const { foodCourtId } = useParams<{ foodCourtId: string }>();
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext(); 
  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [items, setItems] = useState<FoodCourtItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as any;
      const action = lastMessage.action;

      console.log("🔄 Real-time update received in SingleFoodCourt:", {
        update,
        action,
      });

      if (action === "update") {
        setItems((prev) =>
          prev.map((item) => {
            const isMatch =
              item._id === update.id ||
              (item.item_id === update.item_id &&
                update.foodcourt_id === foodCourtId);

            if (isMatch) {
              console.log(
                "Updating item:",
                item._id,
                "with new status:",
                update.status
              );
              return {
                ...item,
                status: update.status,
                price: update.price,
                timeSlot: update.timeSlot,
                isActive: update.isActive,
              };
            }
            return item;
          })
        );
      } else if (action === "delete") {
        setItems((prev) =>
          prev.filter(
            (item) =>
              !(
                item._id === update.id ||
                (item.item_id === update.item_id &&
                  update.foodcourt_id === foodCourtId)
              )
          )
        );
      }
    }
  }, [lastMessage, foodCourtId]);
  useEffect(() => {
    const fetchFoodCourtData = async () => {
      if (!foodCourtId) return;

      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get(
          `/manager/foodcourts/${foodCourtId}`
        );
        const data = response.data.data;

        setFoodCourt(data.foodCourt);

        const formattedItems: FoodCourtItem[] = (data.items || []).map(
          (arr: KeyValuePair[]) => {
            const obj: Record<
              string,
              string | number | boolean | null | undefined
            > = {};
            arr.forEach((item) => {
              obj[item.Key] = item.Value;
            });

            const asString = (k: string) => {
              const v = obj[k];
              return v === null || v === undefined ? "" : String(v);
            };

            const parseNumber = (
              k: string,
              fallback?: number
            ): number | undefined => {
              const v = obj[k];
              if (typeof v === "number") return v;
              if (typeof v === "string" && v.trim() !== "") {
                const n = Number(v);
                return Number.isNaN(n) ? fallback : n;
              }
              return fallback;
            };

            const parseBoolean = (k: string) => {
              const v = obj[k];
              if (typeof v === "boolean") return v;
              if (typeof v === "string")
                return v.toLowerCase() === "true" || v === "1";
              if (typeof v === "number") return v === 1;
              return false;
            };

            const statusRaw = asString("status") || asString("Status");
            const validStatuses: FoodCourtItem["status"][] = [
              "available",
              "notavailable",
              "sellingfast",
              "finishingsoon",
            ];
            const status = validStatuses.includes(
              statusRaw as FoodCourtItem["status"]
            )
              ? (statusRaw as FoodCourtItem["status"])
              : "notavailable";

            const timeSlotRaw =
              asString("timeSlot") ||
              asString("time_slot") ||
              asString("timeSlot");
            const validTimeSlots: FoodCourtItem["timeSlot"][] = [
              "breakfast",
              "lunch",
              "snacks",
              "dinner",
            ];
            const timeSlot = validTimeSlots.includes(
              timeSlotRaw as FoodCourtItem["timeSlot"]
            )
              ? (timeSlotRaw as FoodCourtItem["timeSlot"])
              : "lunch";

            const price = parseNumber("price");
            const basePrice = parseNumber("basePrice", 0) ?? 0;

            const itemObj: FoodCourtItem = {
              _id: asString("_id") || asString("id") || "",
              item_id: asString("item_id") || asString("itemId") || "",
              status,
              price,
              isActive: parseBoolean("isActive") || parseBoolean("is_active"),
              timeSlot,
              name: asString("name") || "",
              description: asString("description") || undefined,
              category: asString("category") || "",
              isVeg: parseBoolean("isVeg") || parseBoolean("is_veg"),
              basePrice,
            };

            return itemObj;
          }
        );

        setItems(formattedItems);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          const responseData = err.response?.data as
            | { message?: string }
            | undefined;
          setError(
            responseData?.message ??
              err.message ??
              "Failed to load food court data"
          );
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFoodCourtData();
  }, [foodCourtId]);

  const updateItemStatus = async (
    itemId: string,
    newStatus: FoodCourtItem["status"]
  ) => {
    try {
      setUpdatingItem(itemId);

      await axiosInstance.put(`/manager/foodcourt/item/${itemId}/status`, {
        status: newStatus,
      });

      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        alert(responseData?.message ?? "Failed to update item status");

        const fetchFoodCourtData = async () => {
          try {
            const response = await axiosInstance.get(
              `/manager/foodcourts/${foodCourtId}`
            );
            const data = response.data.data;
            const formattedItems = formatItems(data.items || []);
            setItems(formattedItems);
          } catch (fetchErr) {
            console.error("Failed to revert update:", fetchErr);
          }
        };
        fetchFoodCourtData();
      } else {
        alert("Failed to update item status");
      }
    } finally {
      setUpdatingItem(null);
    }
  };

  const formatItems = (itemsData: KeyValuePair[][]): FoodCourtItem[] => {
    return itemsData.map((arr: KeyValuePair[]) => {
      const obj: Record<string, string | number | boolean | null | undefined> =
        {};
      arr.forEach((item) => {
        obj[item.Key] = item.Value;
      });

      const asString = (k: string) => {
        const v = obj[k];
        return v === null || v === undefined ? "" : String(v);
      };

      const parseNumber = (
        k: string,
        fallback?: number
      ): number | undefined => {
        const v = obj[k];
        if (typeof v === "number") return v;
        if (typeof v === "string" && v.trim() !== "") {
          const n = Number(v);
          return Number.isNaN(n) ? fallback : n;
        }
        return fallback;
      };

      const parseBoolean = (k: string) => {
        const v = obj[k];
        if (typeof v === "boolean") return v;
        if (typeof v === "string")
          return v.toLowerCase() === "true" || v === "1";
        if (typeof v === "number") return v === 1;
        return false;
      };

      const statusRaw = asString("status") || asString("Status");
      const validStatuses: FoodCourtItem["status"][] = [
        "available",
        "notavailable",
        "sellingfast",
        "finishingsoon",
      ];
      const status = validStatuses.includes(
        statusRaw as FoodCourtItem["status"]
      )
        ? (statusRaw as FoodCourtItem["status"])
        : "notavailable";

      const timeSlotRaw =
        asString("timeSlot") || asString("time_slot") || asString("timeSlot");
      const validTimeSlots: FoodCourtItem["timeSlot"][] = [
        "breakfast",
        "lunch",
        "snacks",
        "dinner",
      ];
      const timeSlot = validTimeSlots.includes(
        timeSlotRaw as FoodCourtItem["timeSlot"]
      )
        ? (timeSlotRaw as FoodCourtItem["timeSlot"])
        : "lunch";

      const price = parseNumber("price");
      const basePrice = parseNumber("basePrice", 0) ?? 0;

      const itemObj: FoodCourtItem = {
        _id: asString("_id") || asString("id") || "",
        item_id: asString("item_id") || asString("itemId") || "",
        status,
        price,
        isActive: parseBoolean("isActive") || parseBoolean("is_active"),
        timeSlot,
        name: asString("name") || "",
        description: asString("description") || undefined,
        category: asString("category") || "",
        isVeg: parseBoolean("isVeg") || parseBoolean("is_veg"),
        basePrice,
      };

      return itemObj;
    });
  };

  const getStatusColor = (status: FoodCourtItem["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "notavailable":
        return "bg-red-100 text-red-800 border-red-200";
      case "sellingfast":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "finishingsoon":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDisplay = (status: FoodCourtItem["status"]) => {
    switch (status) {
      case "available":
        return "Available";
      case "notavailable":
        return "Not Available";
      case "sellingfast":
        return "Selling Fast";
      case "finishingsoon":
        return "Finishing Soon";
      default:
        return status;
    }
  };

  const getTimeSlotDisplay = (timeSlot: FoodCourtItem["timeSlot"]) => {
    switch (timeSlot) {
      case "breakfast":
        return "Breakfast";
      case "lunch":
        return "Lunch";
      case "snacks":
        return "Snacks";
      case "dinner":
        return "Dinner";
      default:
        return timeSlot;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">
          Loading food court details...
        </div>
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
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {foodCourt && (
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-black mb-2">
                      {foodCourt.name}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{foodCourt.location}</span>
                      </div>
                      {foodCourt.timings && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{foodCourt.timings}</span>
                        </div>
                      )}

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
                <div
                  className={`px-4 py-2 rounded-full font-medium ${
                    foodCourt.isOpen
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {foodCourt.isOpen ? "Open" : "Closed"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black">Menu Items</h2>
            <span className="text-gray-600">{items.length} items</span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No items found in this food court</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-black text-lg mb-1">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {item.description || "No description available"}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 ${
                        item.isVeg ? "border-green-500" : "border-red-500"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                          item.isVeg ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-black capitalize">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time Slot:</span>
                      <span className="font-medium text-black">
                        {getTimeSlotDisplay(item.timeSlot)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-black">
                        ₹{item.price || item.basePrice}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Status:
                      </span>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusDisplay(item.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "available",
                        "notavailable",
                        "sellingfast",
                        "finishingsoon",
                      ].map((status) => (
                        <button
                          key={status}
                          disabled={updatingItem === item._id}
                          onClick={() =>
                            updateItemStatus(
                              item._id,
                              status as FoodCourtItem["status"]
                            )
                          }
                          className={`px-2 py-1 text-xs rounded-lg transition-all duration-200 font-medium ${
                            item.status === status
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          } ${
                            updatingItem === item._id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {updatingItem === item._id &&
                          item.status === status ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : (
                            getStatusDisplay(status as FoodCourtItem["status"])
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        Active:
                      </span>
                      <div
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          item.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 transform ${
                            item.isActive ? "translate-x-7" : "translate-x-1"
                          } mt-1`}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/manager/food-courts/${foodCourtId}/items/${item.item_id}`
                      )
                    }
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleFoodCourt;
