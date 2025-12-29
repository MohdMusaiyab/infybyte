import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { AxiosError } from "axios";
import {
  Plus,
  Users,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Search,
} from "lucide-react";

interface Manager {
  _id: string;
  user_id: string;
  userName: string;
  userEmail: string;
  contact_no: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const VendorManagers: React.FC = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchManagers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get("/vendor/managers");
      setManagers(response.data.data || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to load managers"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleDeleteManager = async (managerId: string) => {
    if (!window.confirm("Are you sure you want to remove this manager?")) {
      return;
    }

    try {
      setDeleting(managerId);
      setError("");
      await axiosInstance.delete(`/vendor/managers/${managerId}`);
      setManagers(managers?.filter((manager) => manager._id !== managerId));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to remove manager"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateManager = () => {
    navigate("/vendor/managers/create");
  };

  const handleEditManager = (managerId: string) => {
    navigate(`/vendor/managers/edit/${managerId}`);
  };

  const filteredManagers = managers.filter(
    (manager) =>
      manager.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.contact_no.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && managers.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-black font-bold text-lg mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={fetchManagers}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Managers</h1>
            <p className="text-gray-600">
              Manage your team members and their access
            </p>
          </div>
          <button
            onClick={handleCreateManager}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-medium w-full lg:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            Add Manager
          </button>
        </div>

        {managers.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search managers by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="text-red-800 font-bold">Error</div>
            <div className="text-red-600 mt-1">{error}</div>
          </div>
        )}

        {filteredManagers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              No Managers Found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first manager.
            </p>
            <button
              onClick={handleCreateManager}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 font-medium"
            >
              Add Your First Manager
            </button>
          </div>
        ) : (
          <>
            <div className="lg:hidden grid grid-cols-1 gap-4">
              {filteredManagers.map((manager) => (
                <div
                  key={manager._id}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-black text-lg">
                          {manager.userName}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          {manager.isActive ? (
                            <UserCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <UserX className="w-4 h-4 text-gray-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              manager.isActive
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {manager.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {manager.userEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {manager.contact_no}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Added {new Date(manager.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditManager(manager._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteManager(manager._id)}
                      disabled={deleting === manager._id}
                      className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 px-4 py-2 rounded-xl border-2 border-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 font-medium disabled:opacity-50"
                    >
                      {deleting === manager._id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {deleting === manager._id ? "Removing" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                        Manager Details
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                        Added On
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredManagers.map((manager) => (
                      <tr
                        key={manager._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-black">
                                {manager.userName}
                              </div>
                              <div className="text-gray-600 text-sm">
                                {manager.userEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">
                              {manager.contact_no}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              manager.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {manager.isActive ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                            {manager.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">
                              {new Date(manager.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditManager(manager._id)}
                              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteManager(manager._id)}
                              disabled={deleting === manager._id}
                              className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-xl border-2 border-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 font-medium disabled:opacity-50"
                            >
                              {deleting === manager._id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorManagers;
