import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  Store, 
  Building, 
  Edit, 
  Save, 
  X, 
  Calendar,
  Check,
  Shield,
  Package,
  MapPin
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface ManagerData {
  id: string;
  user_id: string;
  vendor_id: string;
  foodcourt_id: string;
  contact_no: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VendorData {
  id: string;
  shopName: string;
  gst?: string;
  user_id: string;
}

interface FoodCourt {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
  timings?: string;
}

interface Stats {
  totalItems: number;
  itemsInPrimaryFC: number;
  totalManagedFCs: number;
}

interface ProfileData {
  user: UserData;
  manager: ManagerData;
  vendor: VendorData;
  primaryFoodCourt: FoodCourt;
  otherFoodCourts: FoodCourt[];
  stats: Stats;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [editing, setEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNo: "",
    isActive: true
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await axiosInstance.get("/manager/profile");
        const data = response.data.data;
        setProfileData(data);
        
        setFormData({
          name: data.user.name,
          email: data.user.email,
          contactNo: data.manager.contact_no,
          isActive: data.manager.isActive
        });
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          const responseData = err.response?.data as { message?: string } | undefined;
          setError(responseData?.message ?? err.message ?? "Failed to load profile data");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSave = async () => {
    if (!profileData) return;

    try {
      setSaving(true);
      setError("");
      
      type UpdateData = Partial<{
        name: string;
        email: string;
        contactNo: string;
        isActive: boolean;
      }>;
      const updateData: UpdateData = {};
      
      if (formData.name !== profileData.user.name) {
        updateData.name = formData.name;
      }
      if (formData.email !== profileData.user.email) {
        updateData.email = formData.email;
      }
      if (formData.contactNo !== profileData.manager.contact_no) {
        updateData.contactNo = formData.contactNo;
      }
      if (formData.isActive !== profileData.manager.isActive) {
        updateData.isActive = formData.isActive;
      }

      
      if (Object.keys(updateData)?.length > 0) {
        const response = await axiosInstance.put("/manager/profile", updateData);
        setProfileData({
          ...profileData,
          user: response.data.data.user,
          manager: response.data.data.manager
        });
        
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
      
      setEditing(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setError(responseData?.message ?? "Failed to update profile");
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        name: profileData.user.name,
        email: profileData.user.email,
        contactNo: profileData.manager.contact_no,
        isActive: profileData.manager.isActive
      });
    }
    setEditing(false);
    setError("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error && !profileData) {
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

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">No profile data found</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
      
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Manager Profile</h1>
          <p className="text-gray-600">Manage your profile information and settings</p>
        </div>

      
        {successMessage && (
          <div className="mb-6 bg-green-100 border-2 border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black">Personal Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl border-2 border-black hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black focus:ring-0 transition-colors"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="text-black font-medium">{profileData.user.name}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black focus:ring-0 transition-colors"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="text-black font-medium">{profileData.user.email}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.contactNo}
                      onChange={(e) => setFormData({...formData, contactNo: e.target.value})}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black focus:ring-0 transition-colors"
                      placeholder="+1234567890"
                    />
                  ) : (
                    <div className="text-black font-medium">
                      {profileData.manager.contact_no || "Not provided"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Account Status
                  </label>
                  {editing ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={`relative inline-flex items-center w-14 h-8 rounded-full transition-colors ${
                          formData.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform ${
                            formData.isActive ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-black font-medium">
                        {formData.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      profileData.manager.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {profileData.manager.isActive ? "Active" : "Inactive"}
                    </div>
                  )}
                </div>
              </div>
              {!editing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="text-black font-medium capitalize">{profileData.user.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member Since
                    </label>
                    <div className="text-black font-medium">
                      {formatDate(profileData.user.createdAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                <Store className="w-5 h-5" />
                Vendor Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                  <div className="text-black font-medium text-lg">{profileData.vendor.shopName}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                  <div className="text-black font-medium">
                    {profileData.vendor.gst || "Not provided"}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Assigned Food Courts
              </h2>
              
              <div className="space-y-4">
                <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-black text-lg flex items-center gap-2">
                        {profileData.primaryFoodCourt.name}
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Primary
                        </span>
                      </h3>
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {profileData.primaryFoodCourt.location}
                      </p>
                      {profileData.primaryFoodCourt.timings && (
                        <p className="text-sm text-gray-500 mt-1">
                          Timings: {profileData.primaryFoodCourt.timings}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profileData.primaryFoodCourt.isOpen 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {profileData.primaryFoodCourt.isOpen ? "Open" : "Closed"}
                    </div>
                  </div>
                </div>

                {profileData.otherFoodCourts?.map((fc) => (
                  <div key={fc.id} className="border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-black">{fc.name}</h3>
                        <p className="text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {fc.location}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        fc.isOpen 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {fc.isOpen ? "Open" : "Closed"}
                      </div>
                    </div>
                  </div>
                ))}

                {profileData.otherFoodCourts?.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No other food courts assigned
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-black mb-6">Quick Stats</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Total Items</div>
                      <div className="text-lg font-bold text-black">{profileData.stats.totalItems}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Store className="w-8 h-8 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Items in Primary FC</div>
                      <div className="text-lg font-bold text-black">{profileData.stats.itemsInPrimaryFC}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Building className="w-8 h-8 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Managed Food Courts</div>
                      <div className="text-lg font-bold text-black">{profileData.stats.totalManagedFCs}</div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate("/manager/items")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Manage Vendor Items
                  </button>
                  <button
                    onClick={() => navigate(`/manager/food-courts/${profileData.primaryFoodCourt.id}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    View Primary Food Court
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;