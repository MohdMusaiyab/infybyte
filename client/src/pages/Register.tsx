import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { RegisterCredentials } from "../types/auth";
import { isAxiosError } from "axios";
import TextInput from "../components/general/input/TextInput";
import EmailInput from "../components/general/input/EmailInput";
import PasswordInput from "../components/general/input/PasswordInput";
import Button from "../components/general/Button";

const Register = () => {
  const { register } = useAuth();

  const [form, setForm] = useState<RegisterCredentials>({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await register(form); // our hook handles axios + store
      console.log(user);
      setSuccess(`Registration successful. Welcome, ${user.name}!`);
    } catch (err: unknown) {
      // Handle Axios error with backend message
      if (isAxiosError(err)) {
        if (err.response?.data && typeof err.response.data === "object") {
          const backendMessage = (err.response.data as { message?: string })
            .message;
          setError(backendMessage ?? "Registration failed");
        } else {
          setError(err.message || "Registration failed");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in if you already have an account
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            {/* Name Input */}
            <TextInput
              label="Full Name"
              name="name"
              type="text"
              required
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              fullWidth
              theme="blue"
              className="justify-center text-center"
              containerClassName="text-center"
              labelClassName="text-center"
            />

            {/* Email Input */}
            <EmailInput
              label="Email address"
              name="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              fullWidth
              theme="blue"
              className="justify-center text-center"
              containerClassName="text-center"
              labelClassName="text-center"
            />

            {/* Password Input */}
            <PasswordInput
              label="Password"
              name="password"
              autoComplete="new-password"
              required
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              fullWidth
              theme="blue"
              helperText="Password must be at least 6 characters"
              containerClassName="text-center"
              labelClassName="text-center"
              className="justify-center text-center"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              variant="solid"
              size="md"
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {loading ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
