import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Package,
  Store,
  DollarSign,
  Clock,
  Zap,
  MapPin,
} from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";
import Modal from "../../components/general/Modal";
import { useModal } from "../../hooks/useModal";

interface FoodCourt {
  foodCourtId: string;
  foodCourtName: string;
  location: string;
}

interface FoodCourtAssignment extends FoodCourt {
  status: "available" | "notavailable" | "sellingfast" | "finishingsoon";
  price?: number;
  timeSlot: "breakfast" | "lunch" | "snacks" | "dinner";
  isActive: boolean;
  updatedAt: string;
}

interface InaccessibleFoodCourt extends FoodCourt {
  reason: string;
}

interface ItemData {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  vendorId: string;
}

interface ApiResponse {
  item: ItemData;
  currentAssignments: FoodCourtAssignment[];
  availableForAssignment: FoodCourt[];
  notAccessible: InaccessibleFoodCourt[];
  accessInfo: {
    managerFoodCourts: number;
    totalAssignments: number;
    canManage: boolean;
  };
}
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

const ItemManagement: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocketContext();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"current" | "available">(
    "current"
  );
  const [removingFC, setRemovingFC] = useState<string | null>(null);
  const [editingFC, setEditingFC] = useState<string | null>(null);
  const [addingToFC, setAddingToFC] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: "available" as FoodCourtAssignment["status"],
    price: "",
    timeSlot: "lunch" as FoodCourtAssignment["timeSlot"],
    isActive: true,
  });
  const { isOpen, modalConfig, showAlert, showConfirm, hideModal } = useModal();

  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update" && data) {
      const update = lastMessage.payload as WebSocketUpdatePayload;
      const action = lastMessage.action;

      console.log("🔄 Real-time update in ItemManagement:", { update, action });

      if (action === "update" || action === "create" || action === "delete") {
        const refreshData = async () => {
          try {
            const response = await axiosInstance.get(
              `/manager/items/${itemId}`
            );
            setData(response.data.data);
          } catch (err) {
            console.error("Failed to refresh data:", err);
          }
        };

        refreshData();
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    const fetchItemData = async () => {
      if (!itemId) return;

      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get(`/manager/items/${itemId}`);
        setData(response.data.data);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          const responseData = err.response?.data as
            | { message?: string }
            | undefined;
          setError(
            responseData?.message ?? err.message ?? "Failed to load item data"
          );
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItemData();
  }, [itemId]);

  const handleAddToFoodCourt = async (foodCourtId: string) => {
    if (!itemId) return;

    try {
      setSaving(true);

      await axiosInstance.post(`/manager/items/${itemId}/foodcourt`, {
        foodCourtId,
        status: formData.status,
        price: formData.price ? parseFloat(formData.price) : undefined,
        timeSlot: formData.timeSlot,
      });

      const response = await axiosInstance.get(`/manager/items/${itemId}`);
      setData(response.data.data);
      setAddingToFC(null);
      setFormData({
        status: "available",
        price: "",
        timeSlot: "lunch",
        isActive: true,
      });

      
      showAlert("Item added to food court successfully!", "success");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        showAlert(
          responseData?.message ?? "Failed to add item to food court",
          "error"
        );
      } else {
        showAlert("Failed to add item to food court", "error");
      }
    } finally {
      setSaving(false);
    }
  };
  const handleUpdateFoodCourt = async (foodCourtId: string) => {
    if (!itemId) return;

    try {
      setSaving(true);

      const updateData: Partial<{
        status: FoodCourtAssignment["status"];
        price: number | null;
        timeSlot: FoodCourtAssignment["timeSlot"];
        isActive: boolean;
      }> = {};
      if (formData.status) updateData.status = formData.status;
      if (formData.price !== "")
        updateData.price = formData.price ? parseFloat(formData.price) : null;
      if (formData.timeSlot) updateData.timeSlot = formData.timeSlot;
      if (formData.isActive !== undefined)
        updateData.isActive = formData.isActive;

      await axiosInstance.put(`/manager/items/${itemId}/foodcourt`, {
        foodCourtId,
        ...updateData,
      });

      const response = await axiosInstance.get(`/manager/items/${itemId}`);
      setData(response.data.data);
      setEditingFC(null);


      showAlert("Food court item updated successfully!", "success");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        showAlert(
          responseData?.message ?? "Failed to update food court item",
          "error"
        );
      } else {
        showAlert("Failed to update food court item", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromFoodCourt = async (
    foodCourtId: string,
    foodCourtName: string
  ) => {
    if (!itemId) return;

    showConfirm(
      `Are you sure you want to remove this item from ${foodCourtName}?`,
      async () => {
        try {
          setRemovingFC(foodCourtId); 

          await axiosInstance.delete(`/manager/items/${itemId}/foodcourt`, {
            data: { foodCourtId },
          });
          const response = await axiosInstance.get(`/manager/items/${itemId}`);
          setData(response.data.data);

          showAlert("Item removed from food court successfully!", "success");
        } catch (err: unknown) {
          if (err instanceof AxiosError) {
            const responseData = err.response?.data as
              | { message?: string }
              | undefined;
            showAlert(
              responseData?.message ?? "Failed to remove item from food court",
              "error"
            );
          } else {
            showAlert("Failed to remove item from food court", "error");
          }
        } finally {
          setRemovingFC(null); 
        }
      },
      "Confirm Removal"
    );
  };

  const startEditing = (assignment: FoodCourtAssignment) => {
    setEditingFC(assignment.foodCourtId);
    setFormData({
      status: assignment.status,
      price: assignment.price?.toString() || "",
      timeSlot: assignment.timeSlot,
      isActive: assignment.isActive,
    });
  };

  const startAdding = (foodCourt: FoodCourt) => {
    setAddingToFC(foodCourt.foodCourtId);
    setFormData({
      status: "available",
      price: "",
      timeSlot: "lunch",
      isActive: true,
    });
  };

  const cancelAction = () => {
    setEditingFC(null);
    setAddingToFC(null);
    setFormData({
      status: "available",
      price: "",
      timeSlot: "lunch",
      isActive: true,
    });
  };

  const getStatusColor = (status: FoodCourtAssignment["status"]) => {
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

  const getStatusDisplay = (status: FoodCourtAssignment["status"]) => {
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

  const getTimeSlotDisplay = (timeSlot: FoodCourtAssignment["timeSlot"]) => {
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
        <div className="text-lg text-gray-600">Loading item management...</div>
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">No data found</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <Modal
          isOpen={isOpen}
          onClose={hideModal}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onConfirm={modalConfig.onConfirm}
          onCancel={modalConfig.onCancel}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
        />
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black mb-2">
                    {data.item.name}
                  </h1>
                  <p className="text-gray-600 mb-3">{data.item.description}</p>
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        data.item.isVeg
                          ? "border-green-500 text-green-700 bg-green-50"
                          : "border-red-500 text-red-700 bg-red-50"
                      }`}
                    >
                      {data.item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                    </div>
                    {data.item.isSpecial && (
                      <div className="px-3 py-1 rounded-full text-sm font-medium border border-yellow-500 text-yellow-700 bg-yellow-50">
                        Special Item
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      Base Price:{" "}
                      <span className="font-bold text-black">
                        ₹{data.item.basePrice}
                      </span>
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
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-black">
                  {data.accessInfo.totalAssignments}
                </div>
                <div className="text-sm text-gray-600">
                  Food Court Assignments
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("current")}
              className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === "current"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Current Assignments ({data.currentAssignments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("available")}
              className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === "available"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Available Food Courts ({data.availableForAssignment?.length || 0})
            </button>
          </div>
          {activeTab === "current" && (
            <div className="space-y-4">
              {!data.currentAssignments ||
              data.currentAssignments?.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    No food court assignments yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Add this item to your food courts to get started
                  </p>
                </div>
              ) : (
                data.currentAssignments?.map((assignment) => (
                  <div
                    key={assignment.foodCourtId}
                    className="border-2 border-gray-200 rounded-xl p-4"
                  >
                    {editingFC === assignment.foodCourtId ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-black">
                            {assignment.foodCourtName}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleUpdateFoodCourt(assignment.foodCourtId)
                              }
                              disabled={saving}
                              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                            >
                              {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={cancelAction}
                              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status
                            </label>
                            <select
                              value={formData.status}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  status: e.target
                                    .value as FoodCourtAssignment["status"],
                                })
                              }
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-black focus:ring-0"
                            >
                              <option value="available">Available</option>
                              <option value="notavailable">
                                Not Available
                              </option>
                              <option value="sellingfast">Selling Fast</option>
                              <option value="finishingsoon">
                                Finishing Soon
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    price: e.target.value,
                                  })
                                }
                                placeholder={`Base: ₹${data.item.basePrice}`}
                                className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Time Slot
                            </label>
                            <select
                              value={formData.timeSlot}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  timeSlot: e.target
                                    .value as FoodCourtAssignment["timeSlot"],
                                })
                              }
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-black focus:ring-0"
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="snacks">Snacks</option>
                              <option value="dinner">Dinner</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                              Active
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  isActive: !formData.isActive,
                                })
                              }
                              className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${
                                formData.isActive
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                  formData.isActive
                                    ? "translate-x-7"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-black text-lg">
                              {assignment.foodCourtName}
                            </h3>
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">
                                {assignment.location}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                                assignment.status
                              )}`}
                            >
                              {getStatusDisplay(assignment.status)}
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-sm">
                                ₹{assignment.price || data.item.basePrice}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">
                                {getTimeSlotDisplay(assignment.timeSlot)}
                              </span>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                assignment.isActive
                                  ? "border-green-500 text-green-700 bg-green-50"
                                  : "border-red-500 text-red-700 bg-red-50"
                              }`}
                            >
                              {assignment.isActive ? "Active" : "Inactive"}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(assignment)}
                            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleRemoveFromFoodCourt(
                                assignment.foodCourtId,
                                assignment.foodCourtName
                              )
                            }
                            disabled={
                              removingFC === assignment.foodCourtId || saving
                            }
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                              removingFC === assignment.foodCourtId
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-700"
                            } text-white`}
                          >
                            {removingFC === assignment.foodCourtId ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === "available" && (
            <div className="space-y-4">
              {!data.availableForAssignment ||
              data.availableForAssignment?.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No available food courts</p>
                  <p className="text-sm text-gray-500">
                    This item is already in all your assigned food courts
                  </p>
                </div>
              ) : (
                data.availableForAssignment?.map((foodCourt) => (
                  <div
                    key={foodCourt.foodCourtId}
                    className="border-2 border-gray-200 rounded-xl p-4"
                  >
                    {addingToFC === foodCourt.foodCourtId ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-black">
                            {foodCourt.foodCourtName}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleAddToFoodCourt(foodCourt.foodCourtId)
                              }
                              disabled={saving}
                              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                            >
                              {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Add Item
                            </button>
                            <button
                              onClick={cancelAction}
                              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status
                            </label>
                            <select
                              value={formData.status}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  status: e.target
                                    .value as FoodCourtAssignment["status"],
                                })
                              }
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-black focus:ring-0"
                            >
                              <option value="available">Available</option>
                              <option value="notavailable">
                                Not Available
                              </option>
                              <option value="sellingfast">Selling Fast</option>
                              <option value="finishingsoon">
                                Finishing Soon
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    price: e.target.value,
                                  })
                                }
                                placeholder={`Base: ₹${data.item.basePrice}`}
                                className="w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Time Slot
                            </label>
                            <select
                              value={formData.timeSlot}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  timeSlot: e.target
                                    .value as FoodCourtAssignment["timeSlot"],
                                })
                              }
                              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-black focus:ring-0"
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="snacks">Snacks</option>
                              <option value="dinner">Dinner</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-black text-lg mb-1">
                            {foodCourt.foodCourtName}
                          </h3>
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                              {foodCourt.location}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => startAdding(foodCourt)}
                          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Food Court
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {data.notAccessible && data.notAccessible?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">
              Other Food Courts
            </h2>
            <p className="text-gray-600 mb-4">
              This item is available in these food courts, but you don't have
              management access.
            </p>

            <div className="space-y-3">
              {data.notAccessible?.map((fc) => (
                <div
                  key={fc.foodCourtId}
                  className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-black">
                      {fc.foodCourtName}
                    </h3>
                    <p className="text-sm text-gray-600">{fc.location}</p>
                  </div>
                  <div className="text-sm text-gray-500">{fc.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemManagement;
