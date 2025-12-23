import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import axios from "axios";
import type{ User } from "../../types/auth";
import type { ApiResponse } from "../../types/auth";
import { Search, X, Trash2, ChevronLeft, ChevronRight, Users as UsersIcon } from "lucide-react";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  search?: string;
}

interface UsersResponse {
  users: User[];
  meta: PaginationMeta;
}

const AllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");


  const fetchUsers = async (page: number = 1, limit: number = 50, email: string = "") => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (email.trim()) {
        params.append("email", email.trim());
      }
      
      const response = await axiosInstance.get<ApiResponse<UsersResponse>>(
        `/admin/users?${params.toString()}`
      );
      
      const { users: fetchedUsers, meta: fetchedMeta } = response.data.data;
      setUsers(fetchedUsers || []);
      setMeta(fetchedMeta);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to fetch users."
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
    fetchUsers(meta.page, meta.limit, searchEmail);
  }, [meta.page, meta.limit, searchEmail]);

  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEmail(searchInput);
    fetchUsers(1, meta.limit, searchInput);
  };

  
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchEmail("");
    fetchUsers(1, meta.limit, "");
  };

  
  const handleRoleChange = async (userId: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return;

    try {
      setActionLoading(userId);
      setError(null);

      if (newRole === "vendor") {
        await axiosInstance.put(`/admin/users/${userId}/make-vendor`);
      } else if (newRole === "user") {
        await axiosInstance.put(`/admin/users/${userId}/make-user`);
      } else {
        setError("Invalid role selected");
        return;
      }

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, role: newRole as User["role"] } : u
        )
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to update role."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setActionLoading(null);
    }
  };


  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      setError(null);
      await axiosInstance.delete(`/admin/users/${userId}`);
      
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
      
      setMeta((prevMeta) => ({
        ...prevMeta,
        total: prevMeta.total - 1,
      }));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to delete user."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > meta.pages) return;
    fetchUsers(newPage, meta.limit, searchEmail);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
      
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
            <UsersIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">All Users</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage and monitor user accounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 md:px-4 bg-gray-100 rounded-xl w-fit">
          <span className="text-xs md:text-sm text-gray-600">Total:</span>
          <span className="text-base md:text-lg font-bold text-black">{meta.total}</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm md:text-base"
            >
              Search
            </button>
            {searchEmail && (
              <button
                type="button"
                onClick={handleClearSearch}
                disabled={loading}
                className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </form>
        {searchEmail && (
          <div className="mt-3 md:mt-4 px-3 md:px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 break-all">
              Searching for: <span className="font-semibold text-gray-900">{searchEmail}</span>
            </p>
          </div>
        )}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-white" />
          </div>
          <p className="text-red-700 text-xs md:text-sm break-words">{error}</p>
        </div>
      )}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UsersIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">
              {searchEmail ? "No users found matching your search" : "No users found"}
            </p>
            {searchEmail && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-black hover:underline font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 break-words">{user.name}</h3>
                  <p className="text-sm text-gray-600 break-all">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                    Role
                  </label>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, user.role, e.target.value)}
                    disabled={actionLoading === user.id || user.role === "admin"}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    <option value="user">User</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin" disabled>Admin</option>
                  </select>
                </div>
                
                <button
                  onClick={() => handleDeleteUser(user.id, user.name)}
                  disabled={actionLoading === user.id || user.role === "admin"}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all border border-red-200 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  {actionLoading === user.id ? "Processing..." : "Delete User"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3"></div>
                      <p className="text-sm text-gray-500">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <UsersIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        {searchEmail ? "No users found matching your search" : "No users found"}
                      </p>
                      {searchEmail && (
                        <button
                          onClick={handleClearSearch}
                          className="mt-3 text-sm text-black hover:underline font-medium"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, user.role, e.target.value)
                        }
                        disabled={actionLoading === user.id || user.role === "admin"}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        <option value="user">User</option>
                        <option value="vendor">Vendor</option>
                        <option value="admin" disabled>
                          Admin
                        </option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={actionLoading === user.id || user.role === "admin"}
                        className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        {actionLoading === user.id ? "Processing..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {meta.pages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="text-xs md:text-sm text-gray-600 font-medium">
              Page <span className="text-black font-bold">{meta.page}</span> of{" "}
              <span className="text-black font-bold">{meta.pages}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page === 1 || loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 border border-gray-300 rounded-xl text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page === meta.pages || loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 border border-gray-300 rounded-xl text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;