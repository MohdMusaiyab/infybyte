import { useEffect, useState, type ComponentType,  type SVGProps } from "react"
import axiosInstance from "../../utils/axiosInstance"
import { Users, ShoppingBag, TrendingUp, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalVendors: number
  totalOrders: number
  revenue: number
  activeUsers: number
  conversionRate: number
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalOrders: 0,
    revenue: 0,
    activeUsers: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/admin/profile")
        console.log(response.data)
        
        // Mock data - replace with actual API response
        setStats({
          totalUsers: 1247,
          totalVendors: 42,
          totalOrders: 3289,
          revenue: 125640,
          activeUsers: 847,
          conversionRate: 12.5
        })
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    change, 
    loading 
  }: { 
    title: string
    value: string | number
    icon: ComponentType<SVGProps<SVGSVGElement>>
    trend?: 'up' | 'down'
    change?: string
    loading: boolean
  }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-black">{value}</p>
          )}
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend="up"
          change="+12% from last month"
          loading={loading}
        />
        
        <StatCard
          title="Active Vendors"
          value={stats.totalVendors}
          icon={ShoppingBag}
          trend="up"
          change="+3 new this week"
          loading={loading}
        />
        
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={TrendingUp}
          trend="up"
          change="+8% from last month"
          loading={loading}
        />
        
        <StatCard
          title="Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          change="+15% growth"
          loading={loading}
        />
        
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Clock}
          trend="up"
          change="+5% online now"
          loading={loading}
        />
        
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          trend="up"
          change="+2.1% improved"
          loading={loading}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-black mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { user: "John Doe", action: "placed an order", time: "2 min ago", type: "order" },
              { user: "Sarah Wilson", action: "signed up", time: "5 min ago", type: "signup" },
              { user: "Mike's Pizza", action: "updated menu", time: "10 min ago", type: "update" },
              { user: "Alex Chen", action: "completed order", time: "15 min ago", type: "order" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'order' ? 'bg-green-500' : 
                  activity.type === 'signup' ? 'bg-blue-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-black mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Manage Users", icon: Users, color: "bg-blue-500" },
              { label: "View Vendors", icon: ShoppingBag, color: "bg-green-500" },
              { label: "Analytics", icon: TrendingUp, color: "bg-purple-500" },
              { label: "Settings", icon: DollarSign, color: "bg-orange-500" }
            ].map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-black text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard