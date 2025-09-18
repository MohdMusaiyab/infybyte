import React from "react";
import { useAuthStore } from "../store/authStore";

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4 text-center">Welcome to Infybyte</h1>
      {isAuthenticated && user ? (
        <div className="space-y-2 text-lg">
          <div><span className="font-semibold">Name:</span> {user.name}</div>
          <div><span className="font-semibold">Email:</span> {user.email}</div>
          <div><span className="font-semibold">Role:</span> {user.role}</div>
          <div><span className="font-semibold">ID:</span> {user.id}</div>
        </div>
      ) : (
        <div className="text-red-500 text-center">You are not logged in.</div>
      )}
    </div>
  );
};

export default Home;
