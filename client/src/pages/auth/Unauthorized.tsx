import { ChefHat, Shield, ArrowRight, Home } from "lucide-react";
import Button from "../../components/general/Button";

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern Matching Hero */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Floating Food Icons */}
        <div className="absolute top-20 left-10 text-6xl opacity-5 animate-pulse">🍕</div>
        <div className="absolute top-40 right-20 text-6xl opacity-5 animate-pulse delay-500">🍔</div>
        <div className="absolute bottom-32 left-20 text-6xl opacity-5 animate-pulse delay-1000">🍜</div>
        <div className="absolute bottom-20 right-32 text-6xl opacity-5 animate-pulse delay-700">🔒</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Brand Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-bold tracking-tight text-black">Infybite</span>
          </div>

          {/* Main Content */}
          <div className="bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-red-500" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Access Denied
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              You don't have permission to access this page. 
              Please check your credentials or contact support if you believe this is an error.
            </p>

            {/* Error Code */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 mb-8">
              <code className="text-sm text-gray-700 font-mono">
                Error: 403 - Unauthorized Access
              </code>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="solid"
                theme="black"
                size="lg"
                leftIcon={<Home className="w-5 h-5" />}
                onClick={() => window.location.href = "/"}
                className="group hover:scale-105 transition-transform duration-200"
              >
                Go Home
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                theme="black"
                size="lg"
                onClick={() => window.location.href = "/login"}
                className="group hover:scale-105 transition-transform duration-200"
              >
                Back to Login
              </Button>
            </div>
          </div>

          {/* Support Text */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Need help?{" "}
              <a 
                href="mailto:support@infybite.com" 
                className="text-black font-semibold hover:underline transition-colors"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;