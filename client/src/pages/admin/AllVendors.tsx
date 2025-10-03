import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import type { Vendor } from "../../types/type";
import type { ApiResponse } from "../../types/auth";
import axios from "axios";

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

  // Search state
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [searchName, setSearchName] = useState<string>("");
  const [searchInputEmail, setSearchInputEmail] = useState<string>("");
  const [searchInputName, setSearchInputName] = useState<string>("");

  // Fetch all vendors with pagination and search
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

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchEmail(searchInputEmail);
    setSearchName(searchInputName);
    fetchVendors(1, meta.limit, searchInputEmail, searchInputName);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInputEmail("");
    setSearchInputName("");
    setSearchEmail("");
    setSearchName("");
    fetchVendors(1, meta.limit, "", "");
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > meta.pages) return;
    fetchVendors(newPage, meta.limit, searchEmail, searchName);
  };

  // Handle view details
  const handleViewDetails = (vendorId: string) => {
    navigate(`/admin/vendors/${vendorId}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Vendors</h2>
        <div className="text-sm text-gray-600">Total Vendors: {meta.total}</div>
      </div>

      {/* Search Section */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="searchEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search by Email
              </label>
              <input
                type="text"
                id="searchEmail"
                value={searchInputEmail}
                onChange={(e) => setSearchInputEmail(e.target.value)}
                placeholder="Enter email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="searchName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search by Name
              </label>
              <input
                type="text"
                id="searchName"
                value={searchInputName}
                onChange={(e) => setSearchInputName(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              Search
            </button>
            {(searchEmail || searchName) && (
              <button
                type="button"
                onClick={handleClearSearch}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {(searchEmail || searchName) && (
            <div className="text-sm text-gray-600">
              Searching for:{" "}
              {searchEmail && (
                <span className="font-medium">Email: {searchEmail}</span>
              )}
              {searchEmail && searchName && <span> | </span>}
              {searchName && (
                <span className="font-medium">Name: {searchName}</span>
              )}
            </div>
          )}
        </form>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Shop Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="text-sm">Loading...</div>
                  </div>
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {searchEmail || searchName
                    ? "No vendors found matching your search"
                    : "No vendors found"}
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vendor.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{vendor.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vendor.shopName || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(vendor.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(vendor.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {meta.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {meta.page} of {meta.pages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page === 1 || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page === meta.pages || loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllVendors;
