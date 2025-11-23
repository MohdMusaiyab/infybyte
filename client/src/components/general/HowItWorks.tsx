import React, { useState, useEffect } from 'react';
import { CheckCircle, Store, RefreshCw, Users, ArrowRight } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    {
      icon: Store,
      title: "Vendors Update Digital Menu",
      description: "Food court vendors easily mark items as available or sold out through simple dashboard",
      color: "bg-black",
      delay: "delay-200"
    },
    {
      icon: RefreshCw,
      title: "Real-time Sync Across Platform",
      description: "Menu changes instantly reflect on the website and mobile app for all customers",
      color: "bg-black",
      delay: "delay-400"
    },
    {
      icon: Users,
      title: "Customers Check & Decide",
      description: "See exactly what's available before visiting - no more wasted trips or disappointment",
      color: "bg-black",
      delay: "delay-600"
    }
  ];

  return (
    <div className="relative bg-white py-24 overflow-hidden" id="howitworks">
      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>

      {/* Background Pattern Matching Hero */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Floating Icons Matching Hero */}
        <div className="absolute top-10 right-10 text-6xl opacity-5 animate-pulse">📱</div>
        <div className="absolute bottom-20 left-20 text-6xl opacity-5 animate-pulse delay-500">🍽️</div>
        <div className="absolute top-40 left-32 text-6xl opacity-5 animate-pulse delay-1000">🔄</div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          {/* Badge Matching Hero Style */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Simple & Effective</span>
          </div>

          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            How It Works
          </h2>
          
          <p className={`text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Transform your food court experience in three simple steps. 
            No more guesswork, no more wasted trips.
          </p>
        </div>

        {/* Steps Grid - FIXED VISIBILITY */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-20">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`group relative transition-all duration-1000 ${step.delay} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-bold font-mono group-hover:scale-110 transition-transform duration-300 border-2 border-black">
                0{index + 1}
              </div>

              {/* Card - NOW VISIBLE */}
              <div className="bg-white border-2 border-black rounded-3xl p-8 pt-12 group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 h-full">
                {/* Icon Container Matching Hero */}
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border-2 border-black`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-black mb-4 leading-tight">
                  {step.title}
                </h3>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line for Desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gray-300 transform -translate-y-1/2">
                  <div className="w-4 h-4 bg-black rounded-full absolute -top-1.5 -right-2 animate-pulse border-2 border-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Demo Preview - FIXED VISIBILITY */}
        <div className={`bg-black rounded-3xl p-8 md:p-12 relative overflow-hidden transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Background Pattern Inverse */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full mb-6 border-2 border-black">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Live Updates</span>
              </div>

              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                See It In Action
              </h3>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Watch how menu changes sync instantly across all platforms. 
                What vendors update is what customers see - in real-time.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Instant menu availability updates",
                  "Multi-food court vendor management", 
                  "Real-time status indicators",
                  "Mobile & Web Responsive"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-black">
                      <CheckCircle className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-lg text-white">{feature}</span>
                  </div>
                ))}
              </div>

              <a href="/demo-dashboard" className="group px-8 py-4 bg-white text-black text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-2 border-2 border-black">
                View Demo Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Visual Demo */}
            <div className="relative">
              {/* Multiple Device Mockup */}
              <div className="grid grid-cols-2 gap-4">
                {/* Vendor Dashboard */}
                <div className="bg-white rounded-2xl p-4 border-2 border-gray-300 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="text-xs text-gray-500 mb-2">Vendor View</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium">Pizza Margherita</span>
                      <div className="w-3 h-3 bg-green-500 rounded-full border border-green-700"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm font-medium">Garlic Bread</span>
                      <div className="w-3 h-3 bg-red-500 rounded-full border border-red-700"></div>
                    </div>
                  </div>
                </div>

                {/* Customer App */}
                <div className="bg-black rounded-2xl p-4 border-2 border-gray-600 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="text-xs text-gray-400 mb-2">Customer View</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg border border-gray-600">
                      <span className="text-sm font-medium text-white">Pizza Margherita</span>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse border border-green-200"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg opacity-50 border border-gray-600">
                      <span className="text-sm font-medium text-white">Garlic Bread</span>
                      <div className="w-3 h-3 bg-gray-500 rounded-full border border-gray-300"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync Animation */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-12 h-12 bg-black border-4 border-white rounded-full flex items-center justify-center animate-ping">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-lg text-gray-600 mb-6">
            Ready to transform your food court experience?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/register" className="group px-8 py-4 bg-black text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-2 border-2 border-black">
              Get Started Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <a href="/register" className="group px-8 py-4 bg-white text-black text-lg font-semibold rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 flex items-center gap-2">
              <Store className="w-5 h-5" />
              Vendor Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;