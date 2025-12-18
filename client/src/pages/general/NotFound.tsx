import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  ChefHat,
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  Smartphone,
  Frown,
} from "lucide-react";

const NotFound = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="absolute top-40 left-10 text-6xl opacity-5 animate-bounce delay-700">
          🍕
        </div>
        <div className="absolute bottom-40 right-20 text-6xl opacity-5 animate-bounce delay-1000">
          🍔
        </div>
        <div className="absolute top-1/2 left-20 text-6xl opacity-5 animate-bounce delay-1500">
          🍜
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        <nav
          className={`flex items-center justify-between mb-8 transition-all duration-1000 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10"
          }`}
        >
          <Link
            to="/"
            className="flex items-center gap-3 group"
            aria-label="Go to Home"
          >
            <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-black">
              Infybite
            </span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition-all duration-300"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-center mt-8">
          <div className="text-center lg:text-left">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full mb-8 transition-all duration-1000 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Frown className="w-4 h-4" />
              <span className="text-sm font-medium">Page Not Found</span>
            </div>

            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black mb-6 leading-tight transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              Hungry for a
              <br />
              <span className="relative inline-block">
                Different Page
                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-black opacity-10" />
              </span>
            </h1>

            <p
              className={`text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed transition-all duration-1000 delay-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              The menu item you're looking for isn't on this page. Don't worry -
              there's plenty more delicious content to explore!
            </p>
            <div
              className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 transition-all duration-1000 delay-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="bg-black text-white p-6 rounded-2xl">
                <div className="text-3xl font-bold mb-2">404</div>
                <div className="text-sm text-gray-300">Error Code</div>
              </div>
              <div className="bg-white border-2 border-black p-6 rounded-2xl">
                <div className="text-3xl font-bold text-black mb-2">5+</div>
                <div className="text-sm text-gray-600">Vendors Live</div>
              </div>
              <div className="bg-white border-2 border-black p-6 rounded-2xl">
                <div className="text-3xl font-bold text-black mb-2">100+</div>
                <div className="text-sm text-gray-600">Menu Items</div>
              </div>
            </div>
            <div
              className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-1000 delay-900 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Link
                to="/"
                className="group px-8 py-4 bg-black text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2"
                aria-label="Go to Homepage"
              >
                <Home className="w-5 h-5" />
                Back to Home
                <ArrowLeft className="w-5 h-5 transform rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/user/dashboard"
                className="group px-8 py-4 bg-white text-black text-lg font-semibold rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                aria-label="View Live Menus"
              >
                <Search className="w-5 h-5" />
                Explore Live Menus
              </Link>
            </div>
            <div
              className={`mt-12 transition-all duration-1000 delay-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Popular Pages You Might Like:
              </h3>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  to="/user/dashboard"
                  className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-300 text-sm font-medium"
                >
                  Live Dashboard
                </Link>
                <Link
                  to="/vendor/dashboard"
                  className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-300 text-sm font-medium"
                >
                  Vendor Dashboard
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-300 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-300 text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
          <div
            className={`transition-all duration-1000 delay-500 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            }`}
          >
            <div className="relative">
              <div className="bg-black rounded-[3rem] p-3 shadow-2xl mx-auto max-w-sm">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Infybite
                          </div>
                          <div className="text-lg font-bold text-black">
                            Navigation Error
                          </div>
                        </div>
                      </div>
                      <Smartphone className="w-6 h-6 text-black" />
                    </div>

                    <div className="text-center py-12">
                      <div className="text-9xl font-black text-gray-200 mb-6">
                        404
                      </div>
                      <div className="text-xl font-semibold text-black mb-4">
                        Page Not Found
                      </div>
                      <div className="text-gray-600 mb-8">
                        The page you're looking for doesn't exist or has been
                        moved.
                      </div>
                      <div className="flex flex-col gap-3">
                        <Link
                          to="/"
                          className="px-4 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors duration-300"
                        >
                          Go Home
                        </Link>
                        <button
                          onClick={() => navigate(-1)}
                          className="px-4 py-3 bg-white border-2 border-black text-black rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors duration-300"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 mt-8">
                      <div className="p-4 bg-gray-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="text-sm font-medium text-black">
                              Try These Instead:
                            </div>
                            <div className="text-xs text-gray-600">
                              Live Menus • Vendor Dashboard • Login
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-black rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-white" />
                          <div>
                            <div className="text-sm font-medium text-white">
                              Real-time Updates
                            </div>
                            <div className="text-xs text-gray-300">
                              Menu changes happen instantly
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-4 top-20 bg-white border-2 border-black rounded-2xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-black">?</div>
                <div className="text-xs text-gray-600 font-medium">Help</div>
              </div>

              <div className="absolute -right-4 bottom-32 bg-black rounded-2xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-white">!</div>
                <div className="text-xs text-gray-300 font-medium">Error</div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`mt-16 text-center transition-all duration-1000 delay-1200 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-gray-500 text-sm">
            © 2025 Infybite. All
            rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
