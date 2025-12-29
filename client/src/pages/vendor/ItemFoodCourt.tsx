import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Plus,
  Store,
  MapPin,
  Clock,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";
import type { ItemFoodCourtUpdatePayload } from "../../types/websocket";

interface FoodCourtAssociation {
  id: string;
  foodCourtId: string;
  foodCourtName: string;
  location: string;
  status: string;
  price?: number;
  timeSlot: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Item {
  id: string;
  name: string;
  basePrice: number;
}

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
}

const ItemFoodCourt: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { lastMessage, isConnected } = useWebSocketContext();
  const [, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [item, setItem] = useState<Item | null>(null);
  const [foodCourts, setFoodCourts] = useState<FoodCourtAssociation[]>([]);
  const [availableFoodCourts, setAvailableFoodCourts] = useState<FoodCourt[]>(
    []
  );

  const statusOptions = [
    {
      value: "available",
      label: "Available",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "notavailable",
      label: "Not Available",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "sellingfast",
      label: "Selling Fast",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "finishingsoon",
      label: "Finishing Soon",
      color: "bg-yellow-100 text-yellow-800",
    },
  ];

  const timeSlotOptions = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "snacks", label: "Snacks" },
    { value: "dinner", label: "Dinner" },
  ];

  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as ItemFoodCourtUpdatePayload;
      const action = lastMessage.action;

      console.log("🔄 Real-time update received:", { update, action });

      if (action === "update") {
        setFoodCourts((prev) =>
          prev.map((fc) => {
            const isMatch =
              fc.id === update._id || fc.foodCourtId === update.foodcourt_id;

            return isMatch
              ? {
                  ...fc,
                  status: update.status,
                  price: update.price,
                  timeSlot: update.timeSlot,
                  isActive: update.isActive,
                  updatedAt: update.updatedAt,
                }
              : fc;
          })
        );
      } else if (action === "create") {
        fetchItemFoodCourts();
      } else if (action === "delete") {
        setFoodCourts((prev) =>
          prev.filter(
            (fc) =>
              !(fc.id === update._id || fc.foodCourtId === update.foodcourt_id)
          )
        );
      }
    }
  }, [lastMessage]);
  const fetchItemFoodCourts = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [itemFoodCourtsResponse, availableFoodCourtsResponse] =
        await Promise.all([
          axiosInstance.get(`/vendor/items/${id}/foodcourts`),
          axiosInstance.get("/vendor/foodcourts"),
        ]);

      const itemData = itemFoodCourtsResponse.data.data;
      const availableFcData = availableFoodCourtsResponse.data.data || [];

      setItem(itemData.item);
      setFoodCourts(itemData.foodCourts || []);
      setAvailableFoodCourts(availableFcData);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load data");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchItemFoodCourts();
    }
  }, [id, fetchItemFoodCourts]);

  const getFoodCourtAssociationMap = () => {
    const map = new Map<string, FoodCourtAssociation>();
    foodCourts.forEach((fc) => {
      map.set(fc.foodCourtId, fc);
    });
    return map;
  };

  const handlePriceChange = async (foodCourtItemId: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");

    const parts = numericValue.split(".");
    const finalValue =
      parts.length > 2
        ? parts[0] + "." + parts.slice(1).join("")
        : numericValue;

    setFoodCourts((prev) =>
      prev.map((fc) =>
        fc.id === foodCourtItemId
          ? { ...fc, price: finalValue ? parseFloat(finalValue) : undefined }
          : fc
      )
    );
  };

  const handlePriceBlur = async (foodCourtItemId: string, value: string) => {
    if (!value) return;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    try {
      setUpdating(foodCourtItemId);
      setError("");

      await axiosInstance.put(`/vendor/foodcourt-items/${foodCourtItemId}`, {
        price: numericValue,
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to update price"
        );

        fetchItemFoodCourts();
      } else {
        setError("An unexpected error occurred");
        fetchItemFoodCourts();
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateFoodCourtItem = async (
    foodCourtItemId: string,
    field: string,
    value: string | number | boolean
  ) => {
    try {
      setUpdating(foodCourtItemId);
      setError("");

      const updateData: Record<string, string | number | boolean> = {
        [field]: value,
      };
      await axiosInstance.put(
        `/vendor/foodcourt-items/${foodCourtItemId}`,
        updateData
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ??
            err.message ??
            "Failed to update food court item"
        );

        fetchItemFoodCourts();
      } else {
        setError("An unexpected error occurred");
        fetchItemFoodCourts();
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteFoodCourtItem = async (foodCourtItemId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this item from the food court?"
      )
    ) {
      return;
    }

    try {
      setUpdating(foodCourtItemId);
      setError("");

      await axiosInstance.delete(
        `/vendor/foodcourt-items?itemId=${id}&foodCourtId=${foodCourtItemId}`
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ??
            err.message ??
            "Failed to remove item from food court"
        );
        fetchItemFoodCourts();
      } else {
        setError("An unexpected error occurred");
        fetchItemFoodCourts();
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleAddToFoodCourt = async (foodCourtId: string) => {
    try {
      setAdding(foodCourtId);
      setError("");

      const submitData = {
        itemId: id,
        foodCourtId: foodCourtId,
        status: "available",
        timeSlot: "breakfast",
      };

      await axiosInstance.post("/vendor/foodcourt-items", submitData);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ??
            err.message ??
            "Failed to add item to food court"
        );
        fetchItemFoodCourts();
      } else {
        setError("An unexpected error occurred");
        fetchItemFoodCourts();
      }
    } finally {
      setAdding(null);
    }
  };

  const handleBackToEdit = () => {
    navigate(`/vendor/items/edit/${id}`);
  };

  const foodCourtAssociationMap = getFoodCourtAssociationMap();

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBackToEdit}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Edit Item
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Manage Food Courts - {item?.name}
              </h1>
              <p className="text-gray-600">
                Manage item availability across all your food courts
              </p>
            </div>

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
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="text-red-800 font-bold">Error</div>
            <div className="text-red-600 mt-1">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-black mb-4">
              Active Food Courts ({foodCourts.length})
            </h2>
            {foodCourts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  This item is not available in any food courts yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {foodCourts.map((fc) => (
                  <div
                    key={fc.id}
                    className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-black">
                            {fc.foodCourtName}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-600">
                              {fc.location}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Added
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₹)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={fc.price || item?.basePrice || ""}
                            onChange={(e) =>
                              handlePriceChange(fc.id, e.target.value)
                            }
                            onBlur={(e) =>
                              handlePriceBlur(fc.id, e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                            disabled={updating === fc.id}
                            placeholder="0.00"
                          />
                          {updating === fc.id && (
                            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={fc.status}
                          onChange={(e) =>
                            handleUpdateFoodCourtItem(
                              fc.id,
                              "status",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                          disabled={updating === fc.id}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Slot
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <select
                            value={fc.timeSlot}
                            onChange={(e) =>
                              handleUpdateFoodCourtItem(
                                fc.id,
                                "timeSlot",
                                e.target.value
                              )
                            }
                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors appearance-none"
                            disabled={updating === fc.id}
                          >
                            {timeSlotOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Availability
                        </label>
                        <button
                          onClick={() =>
                            handleUpdateFoodCourtItem(
                              fc.id,
                              "isActive",
                              !fc.isActive
                            )
                          }
                          disabled={updating === fc.id}
                          className={`w-full px-4 py-2 rounded-xl border-2 font-medium transition-all duration-300 ${
                            fc.isActive
                              ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                              : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                          }`}
                        >
                          {fc.isActive ? "Active" : "Inactive"}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          handleDeleteFoodCourtItem(fc.foodCourtId)
                        }
                        disabled={updating === fc.id}
                        className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50"
                      >
                        {updating === fc.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {updating === fc.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-black mb-4">
              Available Food Courts (
              {availableFoodCourts.length - foodCourts.length})
            </h2>
            {availableFoodCourts?.filter(
              (fc) => !foodCourtAssociationMap.has(fc.id)
            ).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">
                  This item is available in all your food courts.
                </p>
                <p className="text-sm text-gray-400">
                  Great job! You've covered all locations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableFoodCourts
                  ?.filter((fc) => !foodCourtAssociationMap.has(fc.id))
                  ?.map((fc) => (
                    <div
                      key={fc.id}
                      className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Store className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-black">{fc.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <p className="text-sm text-gray-600">
                                {fc.location}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Available
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              fc.isOpen ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-sm text-gray-600">
                            {fc.isOpen ? "Open Now" : "Currently Closed"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToFoodCourt(fc.id)}
                          disabled={adding === fc.id}
                          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {adding === fc.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {adding === fc.id ? "Adding..." : "Add Item"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemFoodCourt;
