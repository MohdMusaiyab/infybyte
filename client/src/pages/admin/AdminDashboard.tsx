import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Store,
  ArrowUpRight,
  Clock,
  UtensilsCrossed,
} from "lucide-react";

interface DashboardData {
  stats: {
    totalVendors: number;
    totalManagers: number;
    totalItems: number;
  };
  openFoodCourts: Array<{
    _id: string;
    name: string;
    location: string;
  }>;
  recentItems: Array<{
    id: string;
    name: string;
    price: number;
    foodCourtName: string;
    createdAt: string;
  }>;
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/admin/dashboard-stats");
        setData(response.data.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    loading,
  }: {
    title: string;
    value: string | number;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    loading: boolean;
  }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-black">{value}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 pb-10">
      
      <div>
        <h1 className="text-3xl font-bold text-black mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Real-time platform overview and system health.</p>
      </div>

    
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Vendors" value={data?.stats.totalVendors || 0} icon={ShoppingBag} loading={loading} />
        <StatCard title="Total Managers" value={data?.stats.totalManagers || 0} icon={Users} loading={loading} />
        <StatCard title="Menu Items" value={data?.stats.totalItems || 0} icon={UtensilsCrossed} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Store className="w-5 h-5" /> Open Food Courts
            </h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">LIVE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.openFoodCourts.map((fc) => (
              <div key={fc._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                <div>
                  <Link to={`/admin/food-courts/${fc._id}`}  className="font-bold text-gray-900">{fc.name}</Link>
                  <p className="text-xs text-gray-500">{fc.location}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-black mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/admin/all-users" className="flex items-center gap-3 p-3 w-full border border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm">
               <Users className="w-4 h-4 text-blue-600" /> Manage Users
            </Link>
            <Link to="/admin/food-courts" className="flex items-center gap-3 p-3 w-full border border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm">
               <TrendingUp className="w-4 h-4 text-purple-600" /> Manage FoodCourts
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" /> Recently Added Menu Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Food Court</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.recentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.foodCourtName}</td>
                  <td className="px-6 py-4 text-sm font-medium">₹{item.price}</td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;