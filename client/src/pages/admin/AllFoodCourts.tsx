"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import type { FoodCourt } from "../../types/auth";
import axios from "axios";

const AllFoodCourts = () => {
  const [foodCourts, setFoodCourts] = useState<FoodCourt[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    timings: "",
    weekdays: true,
    weekends: true,
    isOpen: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all food courts
  const fetchFoodCourts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/my-food-courts");
      setFoodCourts(res.data.data.foodcourts);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        // Axios error
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Failed to fetch food courts."
        );
      } else if (err instanceof Error) {
        // Generic JS error
        setError(err.message);
      } else {
        // Unknown error type
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodCourts();
  }, []);

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  try {
    await axiosInstance.post("/admin/food-courts", formData);
    setSuccess("Food court created successfully!");
    setFormData({
      name: "",
      location: "",
      timings: "",
      weekdays: true,
      weekends: true,
      isOpen: true,
    });
    fetchFoodCourts(); // refresh list
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined;
      setError(responseData?.message ?? err.message ?? "Failed to create food court.");
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("An unexpected error occurred. Please try again later.");
    }
  }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Food Courts</h1>

      {/* Food Courts List */}
      {loading ? (
        <p>Loading...</p>
      ) : foodCourts.length === 0 ? (
        <p>No food courts found.</p>
      ) : (
        <ul className="mb-8">
          {foodCourts.map((fc) => (
            <li key={fc.id} className="border p-2 mb-2 rounded">
              <strong>{fc.name}</strong> - {fc.location}{" "}
              {fc.timings && `| Timings: ${fc.timings}`}
              <div>
                Weekdays: {fc.weekdays ? "Yes" : "No"} | Weekends:{" "}
                {fc.weekends ? "Yes" : "No"} | Open: {fc.isOpen ? "Yes" : "No"}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create Food Court Form */}
      <div className="border p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Create New Food Court</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-500 mb-2">{success}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="timings"
            placeholder="Timings (optional)"
            value={formData.timings}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <div className="flex gap-4">
            <label>
              <input
                type="checkbox"
                name="weekdays"
                checked={formData.weekdays}
                onChange={handleChange}
              />{" "}
              Weekdays
            </label>
            <label>
              <input
                type="checkbox"
                name="weekends"
                checked={formData.weekends}
                onChange={handleChange}
              />{" "}
              Weekends
            </label>
            <label>
              <input
                type="checkbox"
                name="isOpen"
                checked={formData.isOpen}
                onChange={handleChange}
              />{" "}
              Open
            </label>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600"
          >
            Create Food Court
          </button>
        </form>
      </div>
    </div>
  );
};

export default AllFoodCourts;
