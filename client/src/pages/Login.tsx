import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../types/auth";
import axios from "axios"; // for type checking in catch
import EmailInput from "../components/general/input/EmailInput";
import PasswordInput from "../components/general/input/PasswordInput";
import Button from "../components/general/Button";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await login(form); // our hook handles axios + store
      setSuccess(`Welcome back, ${user.name}! Redirecting...`);

      setTimeout(() => {
        navigate(`/${user.role}/dashboard`); // Redirect based on role
      }, 1200);
    } catch (err: unknown) {
      // Axios error handling with full type safety
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string }
          | undefined;
        setError(
          responseData?.message ?? err.message ?? "Login failed. Try again."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create an account if you don't have one
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Email */}
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
              containerClassName="text-center"
              labelClassName="text-center block"
              className="text-center"
            />
            {/* Password */}
            <PasswordInput
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              fullWidth
              theme="blue"
              containerClassName="text-center"
              labelClassName="text-center block"
              className="text-center"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Submit */}
          <div>
            <Button
              type="submit"
              variant="solid"
              size="md"
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
