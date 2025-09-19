import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService"; // Import authService instead of api
import { useAuthStore } from "../store/authStore"; // Import auth store to get loading state

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const loading = useAuthStore((state) => state.isLoading); // Get loading state from store
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    role: "vendor",
  });
  const [error, setError] = useState<string>("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    try {
      const user = await authService.register(form);
      
      console.log("Registration successful:", user);
      
      // Show success message or redirect immediately
      navigate("/login", { 
        state: { message: "Registration successful! Please login." }
      });
      
    } catch (err) {
      if (err instanceof Error) {
        console.error("Registration error:", err);
        setError(err.message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg flex flex-col items-stretch">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Register</h2>
      
      {error && (
        <p className="text-red-600 bg-red-50 rounded-md px-3 py-2 mb-4 text-center text-base border border-red-200">
          {error}
        </p>
      )}
      
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="font-medium text-gray-700">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-base"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-base"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-base"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="font-medium text-gray-700">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-base"
          >
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="user">User</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-2 bg-gradient-to-r from-indigo-500 to-blue-400 text-white text-lg font-semibold rounded-md shadow hover:from-indigo-600 hover:to-blue-500 transition disabled:bg-indigo-200 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;