import { useEffect } from "react"
import axiosInstance from "../../utils/axiosInstance"
const AdminDashboard = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/admin/profile")
        console.log(response.data)
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error)
      }
    }
    fetchData()
  }, [])

  return (
    <div>AdminDashboard</div>
  )
}

export default AdminDashboard