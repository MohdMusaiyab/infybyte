import React from "react";
import { useAuth } from "../../hooks/useAuth";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="text-center mt-20 text-lg">Loading user info...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
      <div className="space-y-2">
        <p>
          <span className="font-semibold">Name:</span> {user.name}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        <p>
          <span className="font-semibold">Role:</span> {user.role}
        </p>
        <p>
          <span className="font-semibold">User ID:</span> {user.id}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
