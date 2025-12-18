import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { LoginCredentials } from "../../types/auth";
import axios from "axios";
import EmailInput from "../../components/general/input/EmailInput";
import PasswordInput from "../../components/general/input/PasswordInput";
import Button from "../../components/general/Button";
import { ChefHat, ArrowRight } from "lucide-react";

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
      const user = await login(form); 
      setSuccess(`Welcome back, ${user.name}! Redirecting...`);

      setTimeout(() => {
        navigate(`/${user.role}/dashboard`); 
      }, 1200);
    } catch (err: unknown) {
      
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
      setTimeout(() => {
        setError(null);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px]" />
        
      
        <div className="absolute top-20 left-10 text-6xl opacity-5 animate-pulse">🍕</div>
        <div className="absolute top-40 right-20 text-6xl opacity-5 animate-pulse delay-500">🍔</div>
        <div className="absolute bottom-32 left-20 text-6xl opacity-5 animate-pulse delay-1000">🍜</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      
        <div className="max-w-md w-full space-y-8 bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-2xl">
      
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold tracking-tight text-black">Infybite</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 text-lg">
              Sign in to your account
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
      
              <EmailInput
                label="Email address"
                name="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                theme="slate"
                variant="outline"
                inputSize="lg"
                containerClassName="text-left"
                labelClassName="text-left block text-gray-700 font-medium"
                className="text-left border-2 border-gray-300 focus:border-black"
              />
              <PasswordInput
                label="Password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                fullWidth
                theme="slate"
                variant="outline"
                inputSize="lg"
                containerClassName="text-left"
                labelClassName="text-left block text-gray-700 font-medium"
                className="text-left border-2 border-gray-300 focus:border-black"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-700 text-center font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                <p className="text-sm text-green-700 text-center font-medium">{success}</p>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                variant="solid"
                theme="black"
                size="lg"
                loading={loading}
                disabled={loading}
                fullWidth
                className="group hover:scale-105 transition-transform duration-200"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="font-semibold text-black hover:text-gray-700 underline transition-colors"
                >
                  Create one now
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;