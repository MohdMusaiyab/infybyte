import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      navigate('/login', { state: { message: 'You have been logged out successfully' } });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Infybyte</h1>
      {isAuthenticated && user ? (
        <>
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
            <div className="text-xl font-semibold text-center mb-4 text-blue-800">User Profile</div>
            <div className="space-y-3 text-lg">
              <div><span className="font-semibold">Name:</span> {user.name}</div>
              <div><span className="font-semibold">Email:</span> {user.email}</div>
              <div><span className="font-semibold">Role:</span> <span className="capitalize">{user.role}</span></div>
              <div><span className="font-semibold">ID:</span> <span className="text-gray-500 text-sm">{user.id}</span></div>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md transition-colors 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging out...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Logout
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="text-red-500 text-center p-4 border border-red-200 bg-red-50 rounded-lg">
          You are not logged in. Please <a href="/login" className="text-blue-500 underline">login</a> to access this page.
        </div>
      )}
    </div>
  );
};

export default Home;
