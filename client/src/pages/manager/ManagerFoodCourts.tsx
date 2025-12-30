import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import {
  Store,
  MapPin,
  Clock,
  ChevronRight,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
  timings: string;
  assignedAt: string;
}

const ManagerFoodCourts = () => {
  const [courts, setCourts] = useState<FoodCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignedCourts = async () => {
      try {
        const response = await axiosInstance.get("/manager/foodcourts");
        setCourts(response.data.data);
      } catch (error) {
        console.error("Failed to fetch courts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedCourts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          My Assigned Food Courts
        </h1>
        <p className="text-sm text-gray-500">
          Select a food court to manage its menu items and availability.
        </p>
      </div>

      {courts?.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-amber-900">
            No Assignments Found
          </h3>
          <p className="text-amber-700">
            You haven't been assigned to any food courts yet. Please contact the
            Admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courts?.map((court) => (
            <div
              key={court.id}
              onClick={() => navigate(`/manager/food-courts/${court.id}`)}
              className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-black transition-all cursor-pointer relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${
                  court.isOpen
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {court.isOpen ? "● Open Now" : "○ Closed"}
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <Link to={`/manager/food-courts/${court.id}`}>
                    <h3 className="text-lg font-bold text-black group-hover:text-black">
                      {court.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <MapPin className="w-3 h-3" />
                    {court.location}
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-50 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    Timings
                  </span>
                  <span className="font-medium text-black">
                    {court.timings || "N/A"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm font-bold text-black group-hover:gap-2 transition-all">
                <span>Manage Items</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerFoodCourts;
