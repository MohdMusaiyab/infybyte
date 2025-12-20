import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { User, Mail, Calendar, Edit, Save, X, Shield } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editData, setEditData] = useState<UpdateProfileData>({
    name: "",
    email: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get("/user/profile");
      setProfile(response.data.data);
      setEditData({
        name: response.data.data.name,
        email: response.data.data.email,
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to load profile"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      name: profile?.name || "",
      email: profile?.email || "",
    });
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: profile?.name || "",
      email: profile?.email || "",
    });
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!editData.name?.trim() || !editData.email?.trim()) {
      setError("Name and email are required");
      return;
    }

    if (editData.name.length < 2 || editData.name.length > 50) {
      setError("Name must be between 2 and 50 characters");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const updateData: UpdateProfileData = {};
      if (editData.name !== profile?.name) {
        updateData.name = editData.name;
      }
      if (editData.email !== profile?.email) {
        updateData.email = editData.email;
      }

      if (Object.keys(updateData).length === 0) {
        setError("No changes made");
        return;
      }

      await axiosInstance.put("/user/profile", updateData);

      setSuccess("Profile updated successfully");
      setIsEditing(false);
      await fetchUserProfile();
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to update profile"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: keyof UpdateProfileData, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="text-red-800 font-bold">Error</div>
            <div className="text-red-600 mt-1">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
            <div className="text-green-800 font-bold">Success</div>
            <div className="text-green-600 mt-1">{success}</div>
          </div>
        )}

        {profile && (
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {profile.name}
                  </h2>
                  <p className="text-gray-600">{profile.email}</p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
                >
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updating}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Name Field */}
              <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="text-lg font-medium text-black">
                      {profile.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none transition-colors"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="text-lg font-medium text-black">
                      {profile.email}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </div>
                  <div className="text-lg font-medium text-black capitalize">
                    {profile.role}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Member Since</div>
                    <div className="font-medium text-black">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Last Updated</div>
                    <div className="font-medium text-black">
                      {new Date(profile.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isEditing && (
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <h3 className="font-bold text-blue-800 mb-2">
                  Editing Your Profile
                </h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Name must be between 2-50 characters</li>
                  <li>• Email must be valid format</li>
                  <li>• Click Save Changes to apply updates</li>
                  <li>• Click Cancel to discard changes</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-black mb-4">
              Account Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Password</span>
                <button className="text-black hover:underline font-medium text-sm">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
