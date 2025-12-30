import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import type { ApiResponse } from "../../types/auth";
import axios from "axios";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Edit,
  Save,
  X,
  CheckCircle2,
  Store,
  MapPin,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

interface FoodCourtSummary {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
}

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  foodcourts: FoodCourtSummary[];
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<ApiResponse<AdminProfile>>(
        "/admin/profile"
      );
      const profileData = response.data.data;
      setProfile(profileData);
      setFormData({
        name: profileData.name,
        email: profileData.email,
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to fetch profile."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await axiosInstance.put<ApiResponse<null>>("/admin/profile", formData);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      await fetchProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to update profile."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6 text-white" />
          </div>
          <p className="text-red-700 font-medium">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
            Admin Profile
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage your account information and food courts
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-xs md:text-sm break-words">
            {successMessage}
          </p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-white" />
          </div>
          <p className="text-red-700 text-xs md:text-sm break-words">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-black to-gray-800 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center text-black font-bold text-3xl md:text-4xl flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-white break-words">
                {profile.name}
              </h2>
              <p className="text-sm md:text-base text-gray-300 mt-1 break-all">
                {profile.email}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500 bg-opacity-30 text-white rounded-lg mt-2 text-xs md:text-sm font-semibold">
                <Shield className="w-3 h-3 md:w-4 md:h-4" />
                {profile.role.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900">
              Personal Information
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm md:text-base"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-2"
                >
                  <User className="w-4 h-4" />
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium text-sm md:text-base"
                >
                  <Save className="w-4 h-4" />
                  {updateLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={updateLoading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium text-sm md:text-base"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <User className="w-4 h-4" />
                  Name
                </label>
                <p className="text-base md:text-lg font-semibold text-gray-900 break-words">
                  {profile.name}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-base md:text-lg font-semibold text-gray-900 break-all">
                  {profile.email}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    <Calendar className="w-4 h-4" />
                    Account Created
                  </label>
                  <p className="text-xs md:text-sm text-gray-700 break-words">
                    {formatDate(profile.created_at)}
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    <Clock className="w-4 h-4" />
                    Last Updated
                  </label>
                  <p className="text-xs md:text-sm text-gray-700 break-words">
                    {formatDate(profile.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Store className="w-5 h-5 md:w-6 md:h-6 text-black" />
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Your Food Courts ({profile.foodcourts?.length || 0})
          </h2>
        </div>

        {profile.foodcourts && profile.foodcourts?.length > 0 ? (
          <div className="space-y-3">
            {profile.foodcourts?.map((foodcourt) => (
              <div
                key={foodcourt.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/admin/food-courts/${foodcourt.id}`}>
                      <h3 className="font-bold text-base md:text-lg text-gray-900 break-words mb-2">
                        {foodcourt.name}
                      </h3>
                    </Link>
                    <div className="flex items-start gap-2 text-xs md:text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{foodcourt.location}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs md:text-sm font-medium flex-shrink-0 ${
                      foodcourt.isOpen
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {foodcourt.isOpen ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Open
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        Closed
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">
              No food courts created yet
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first food court to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
