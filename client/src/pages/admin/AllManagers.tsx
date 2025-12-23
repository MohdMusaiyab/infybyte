import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  Users,
  Search,
  Store,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
interface Manager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  foodCourt?: {
    id: string;
    name: string;
  };
  vendorId: string;
  vendors: string[];
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const AllManagers = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [meta, setMeta] = useState<Meta>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");

  const [emailQuery, setEmailQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");

  const fetchManagers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "50",
          email: emailQuery,
          name: nameQuery,
        });

        const response = await axiosInstance.get(
          `/admin/managers?${params.toString()}`
        );
        setManagers(response.data.data.managers);
        setMeta(response.data.data.meta);
      } catch (err) {
        setError("Failed to fetch managers list.");
        console.error("Error fetching managers:", err);
      } finally {
        setLoading(false);
      }
    },
    [emailQuery, nameQuery]
  );

  useEffect(() => {
    fetchManagers(meta.page);
  }, [meta.page, fetchManagers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchManagers(1);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black rounded-2xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Managers Directory
            </h1>
            <p className="text-gray-500">
              Oversee staff assignments and operations
            </p>
          </div>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
          <span className="text-sm text-gray-600 font-medium">
            Total Managers:{" "}
          </span>
          <span className="text-lg font-bold text-black">{meta.total}</span>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          className="bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
        >
          Filter Results
        </button>
      </form>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                  Manager Details
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                  Assigned Food Court
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                  Owning Vendors
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="h-20 bg-gray-50/50"></td>
                      </tr>
                    ))
                : managers.map((manager) => (
                    <tr
                      key={manager.id}
                      className="hover:bg-gray-50/80 transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
                            {manager.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {manager.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {manager.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {manager.foodCourt ? (
                          <div className="flex items-center gap-2 text-sm font-medium text-black bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                            <Link
                              to={`/admin/food-courts/${manager.foodCourt.id}`}
                              className="flex items-center gap-2"
                            >
                              <Store className="w-3.5 h-3.5 text-blue-600" />
                              {manager.foodCourt.name}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No Court Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {manager.vendors && manager.vendors.length > 0 ? (
                            manager.vendors.map((v, i) => (
                              <Link
                                key={i}
                                to={`/admin/vendor/${manager.vendorId}`} // <--- USE THE NEW ID HERE
                                className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 hover:bg-black hover:text-white transition-colors cursor-pointer"
                              >
                                {v}
                              </Link>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              N/A
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
      {meta.pages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
          <p className="text-sm text-gray-500">
            Page {meta.page} of {meta.pages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={meta.page === 1}
              onClick={() =>
                setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="p-2 border rounded-lg disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={meta.page === meta.pages}
              onClick={() =>
                setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              className="p-2 border rounded-lg disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllManagers;
