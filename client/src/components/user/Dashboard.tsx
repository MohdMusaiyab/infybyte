
import { useEffect, useState } from "react";
import api from "../../api/axios";

interface TestResponse {
  message: string;
  userID: string;
  role: string;
}

const Dashboard = () => {
  const [data, setData] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ message: string; userID: string; role: string }>("/test");
        setData(response.data);
      } catch (err: unknown) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {data && (
        <>
          <p>Message: {data.message}</p>
          <p>UserID: {data.userID}</p>
          <p>Role: {data.role}</p>
        </>
      )}
    </div>
  );
};

export default Dashboard;
