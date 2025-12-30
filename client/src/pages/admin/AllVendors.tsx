import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import type { Vendor } from "../../types/type";
import type { ApiResponse } from "../../types/auth";
import axios from "axios";
import {
  Search,
  X,
  Store,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  searchEmail?: string;
  searchName?: string;
}

interface VendorsResponse {
  vendors: Vendor[];
  meta: PaginationMeta;
}

const AllVendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchEmail, setSearchEmail] = useState<string>("");
  const [searchName, setSearchName] = useState<string>("");
  const [searchInputEmail, setSearchInputEmail] = useState<string>("");
  const [searchInputName, setSearchInputName] = useState<string>("");

  const fetchVendors = async (
    page: number = 1,
    limit: number = 50,
    email: string = "",
    name: string = ""
  ) => {
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
      if (name.trim()) {
        params.append("name", name.trim());
      }

      const response = await axiosInstance.get<ApiResponse<VendorsResponse>>(
        `/admin/vendors?${params.toString()}`
      );

      const { vendors: fetchedVendors, meta: fetchedMeta } = response.data.data;
      setVendors(fetchedVendors || []);
      setMeta(fetchedMeta);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to fetch vendors."
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
    fetchVendors(meta.page, meta.limit, searchEmail, searchName);
  }, [meta.page, meta.limit, searchEmail, searchName]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEmail(searchInputEmail);
    setSearchName(searchInputName);
    fetchVendors(1, meta.limit, searchInputEmail, searchInputName);
  };

  const handleClearSearch = () => {
    setSearchInputEmail("");
    setSearchInputName("");
    setSearchEmail("");
    setSearchName("");
    fetchVendors(1, meta.limit, "", "");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > meta.pages) return;
    fetchVendors(newPage, meta.limit, searchEmail, searchName);
  };

  const handleViewDetails = (vendorId: string) => {
    navigate(`/admin/vendor/${vendorId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && vendors?.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">
              All Vendors
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage vendor accounts and shops
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 md:px-4 bg-gray-100 rounded-xl w-fit">
          <span className="text-xs md:text-sm text-gray-600">Total:</span>
          <span className="text-base md:text-lg font-bold text-black">
            {meta.total}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label
                htmlFor="searchEmail"
                className="block text-xs md:text-sm font-medium text-gray-700 mb-2"
              >
                Search by Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="text"
                  id="searchEmail"
                  value={searchInputEmail}
                  onChange={(e) => setSearchInputEmail(e.target.value)}
                  placeholder="Enter email..."
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="searchName"
                className="block text-xs md:text-sm font-medium text-gray-700 mb-2"
              >
                Search by Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="text"
                  id="searchName"
                  value={searchInputName}
                  onChange={(e) => setSearchInputName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm md:text-base"
            >
              Search
            </button>
            {(searchEmail || searchName) && (
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
          {(searchEmail || searchName) && (
            <div className="px-3 md:px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs md:text-sm text-gray-600 break-words">
                Searching for:{" "}
                {searchEmail && (
                  <span className="font-semibold text-gray-900">
                    Email: {searchEmail}
                  </span>
                )}
                {searchEmail && searchName && <span> | </span>}
                {searchName && (
                  <span className="font-semibold text-gray-900">
                    Name: {searchName}
                  </span>
                )}
              </p>
            </div>
          )}
        </form>
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
            <p className="text-sm text-gray-500">Loading vendors...</p>
          </div>
        ) : vendors?.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">
              {searchEmail || searchName
                ? "No vendors found matching your search"
                : "No vendors found"}
            </p>
            {(searchEmail || searchName) && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-black hover:underline font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          vendors?.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {vendor.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 break-words">
                    {vendor.name}
                  </h3>
                  <p className="text-sm text-gray-600 break-all">
                    {vendor.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">Shop:</span>
                  <span className="font-medium text-gray-900 break-words">
                    {vendor.shopName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(vendor.createdAt)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleViewDetails(vendor.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
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
                  Created At
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-3"></div>
                      <p className="text-sm text-gray-500">
                        Loading vendors...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : vendors?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Store className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        {searchEmail || searchName
                          ? "No vendors found matching your search"
                          : "No vendors found"}
                      </p>
                      {(searchEmail || searchName) && (
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
                vendors?.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                          {vendor.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {vendor.email}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatDate(vendor.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(vendor.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-lg text-sm font-medium transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
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

export default AllVendors;
