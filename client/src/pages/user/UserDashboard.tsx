import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { MapPin, Clock, Search, Filter, Heart, Utensils } from "lucide-react";

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  timings: string;
  isOpen: boolean;
  weekends: boolean;
  weekdays: boolean;
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [foodCourts, setFoodCourts] = useState<FoodCourt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchFoodCourts();
  }, []);

  const fetchFoodCourts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get("/user/foodcourts");
      setFoodCourts(response.data.data || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? err.message ?? "Failed to load food courts");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredFoodCourts = foodCourts.filter(fc =>
    fc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fc.location.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(fc => !filterOpen || fc.isOpen);

  const handleFoodCourtClick = (foodCourtId: string) => {
    navigate(`/user/foodcourt/${foodCourtId}`);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={fetchFoodCourts}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Discover Food Courts</h1>
          <p className="text-gray-600">Find your favorite food spots and explore new ones</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search food courts by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
              />
            </div>
            
            {/* Filter */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 font-medium ${
                filterOpen
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-200 hover:border-black'
              }`}
            >
              <Filter className="w-5 h-5" />
              Open Now
            </button>
          </div>
        </div>

        {/* Food Courts Grid */}
        {filteredFoodCourts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">No food courts found</h3>
            <p className="text-gray-600">
              {searchTerm || filterOpen 
                ? "Try adjusting your search or filter criteria" 
                : "No food courts available at the moment"}
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              <span>{filteredFoodCourts.length} food court(s) found</span>
              {(searchTerm || filterOpen) && (
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterOpen(false);
                  }}
                  className="text-black hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Food Courts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoodCourts.map((foodCourt) => (
                <div
                  key={foodCourt.id}
                  onClick={() => handleFoodCourtClick(foodCourt.id)}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg hover:border-black transition-all duration-300 cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-black text-lg">{foodCourt.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-2 h-2 rounded-full ${foodCourt.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-sm font-medium ${foodCourt.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                            {foodCourt.isOpen ? 'Open Now' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 text-sm">{foodCourt.location}</span>
                  </div>

                  {/* Timings */}
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 text-sm">{foodCourt.timings}</span>
                  </div>

                  {/* Operating Days */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {foodCourt.weekdays && <span>Weekdays</span>}
                    {foodCourt.weekends && <span>Weekends</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;