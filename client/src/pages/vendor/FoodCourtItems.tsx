import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  Clock,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
  Loader,
  Search,
} from "lucide-react";
import { useWebSocketContext } from "../../context/WebSocketContext";

interface FoodCourtItem {
  id: string;
  item_id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  basePrice: number;
  status: "available" | "notavailable" | "sellingfast" | "finishingsoon";
  timeSlot: "breakfast" | "lunch" | "snacks" | "dinner";
  isActive: boolean;
  isVeg: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const FoodCourtItems: React.FC = () => {
  const navigate = useNavigate();
  const { foodCourtId } = useParams<{ foodCourtId: string }>();
  const { lastMessage, isConnected } = useWebSocketContext();

  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [items, setItems] = useState<FoodCourtItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string>("");

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "notavailable", label: "Not Available" },
    { value: "sellingfast", label: "Selling Fast" },
    { value: "finishingsoon", label: "Finishing Soon" },
  ];

  const fetchItems = useCallback(async () => {
    if (!foodCourtId) return;
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get<ApiResponse<FoodCourtItem[]>>(
        `/vendor/foodcourts/${foodCourtId}/items`
      );
      setItems(response.data.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const msg =
          err.response?.data?.message || "Failed to load food court items";
        setError(msg);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [foodCourtId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === "item_foodcourt_update") {
      const update = lastMessage.payload as any;

      if (update.foodcourt_id === foodCourtId) {
        setItems((prev) =>
          prev?.map((item) => {
            const isMatch = item.id === update._id || item.id === update.id;

            if (isMatch) {
              return {
                ...item,

                status: update.status ?? item.status,
                price: update.price ?? item.price,
                isActive:
                  update.isActive !== undefined
                    ? update.isActive
                    : item.isActive,
                timeSlot: update.timeSlot ?? item.timeSlot,
              };
            }
            return item;
          })
        );
      }
    }
  }, [lastMessage, foodCourtId]);

  const handleUpdate = async (
    id: string,
    field: keyof FoodCourtItem,
    value: string | number | boolean
  ) => {
    try {
      setUpdating(id);
      setError("");

      await axiosInstance.put(`/vendor/foodcourt-items/${id}`, {
        [field]: value,
      });

      setItems((prev) =>
        prev?.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Update failed");
      }
      fetchItems();
    } finally {
      setUpdating(null);
    }
  };

  const filteredItems = items?.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="w-10 h-10 animate-spin text-black" />
      </div>
    );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-black mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-black flex items-center gap-3">
            <LayoutGrid className="w-8 h-8" />
            Menu Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              className="pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl focus:border-black outline-none w-64"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>
          <div
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              isConnected
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              } animate-pulse`}
            />
            {isConnected ? "LIVE" : "OFFLINE"}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <XCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems?.map((item) => (
          <div
            key={item.id}
            className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-black transition-all group relative"
          >
            {updating === item.id && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                <Loader className="w-6 h-6 animate-spin text-black" />
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 border-2 ${
                      item.isVeg ? "border-green-600" : "border-red-600"
                    } flex items-center justify-center`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${
                        item.isVeg ? "bg-green-600" : "bg-red-600"
                      }`}
                    />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {item.category}
                  </span>
                </div>
                <Link
                  to={`/vendor/items/edit/${item.item_id}`}
                  className="text-lg font-bold text-black group-hover:text-blue-600 transition-colors"
                >
                  {item.name}
                </Link>
              </div>
              <button
                onClick={() =>
                  handleUpdate(item.id, "isActive", !item.isActive)
                }
                className={`p-2 rounded-lg transition-colors ${
                  item.isActive
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {item.isActive ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-transparent focus-within:border-gray-200">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={item.price ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;

                    setItems((prev) =>
                      prev?.map((i) =>
                        i.id === item.id ? { ...i, price: parseFloat(val) } : i
                      )
                    );
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleUpdate(item.id, "price", val);
                  }}
                  className="bg-transparent font-bold text-black outline-none w-full"
                />
                <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-100 text-gray-500 font-bold uppercase whitespace-nowrap">
                  ₹ {item.basePrice} Base
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <select
                  value={item.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleUpdate(item.id, "status", e.target.value)
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 ring-black/5 cursor-pointer"
                >
                  {statusOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-gray-100 flex justify-between items-center text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.timeSlot.toUpperCase()}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => navigate(`/vendor/items-management`)}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all gap-3 min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold">Link New Items</span>
        </button>
      </div>
    </div>
  );
};

export default FoodCourtItems;
