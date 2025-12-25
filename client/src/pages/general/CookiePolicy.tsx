import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cookie, Info, Settings } from "lucide-react";
import Footer from "../../components/general/Footer";

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 group transition-colors"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="mb-8 text-center">
          <div className="inline-block p-3 bg-gray-100 rounded-full mb-4 text-black">
            <Cookie className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">Cookie Policy</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            How we use cookies to improve your management experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-gray-200 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-black" />
              <h3 className="font-bold">Essential Cookies</h3>
            </div>
            <p className="text-sm text-gray-600">
              These are required for the platform to function. They allow you to
              stay logged in while navigating between the Dashboard and Manager
              views.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-black" />
              <h3 className="font-bold">Analytics Cookies</h3>
            </div>
            <p className="text-sm text-gray-600">
              We use these to understand how users interact with the vendor
              dashboard so we can optimize the UI for efficiency.
            </p>
          </div>

          <div className="md:col-span-2 bg-black text-white p-8 rounded-2xl text-center">
            <h3 className="text-xl font-bold mb-4">
              Managing Your Preferences
            </h3>
            <p className="text-gray-300 mb-6">
              You can control or reset your cookies through your web browser
              settings at any time.
            </p>
          </div>
        </div>
      </div>
      <Footer></Footer>
    </>
  );
};

export default CookiePolicy;
