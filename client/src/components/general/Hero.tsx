import React, { useState, useEffect } from 'react';
import { ArrowRight, Smartphone, Store, Menu, ChefHat, Clock, MapPin } from 'lucide-react';

const InfybiteHero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFood, setCurrentFood] = useState(0);

  const foodItems = ['Pizza', 'Burger', 'Biryani', 'Momos', 'Dosa'];

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      setCurrentFood((prev) => (prev + 1) % foodItems.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Floating Food Icons */}
        <div className="absolute top-20 left-10 text-6xl opacity-5 animate-pulse">🍕</div>
        <div className="absolute top-40 right-20 text-6xl opacity-5 animate-pulse delay-500">🍔</div>
        <div className="absolute bottom-32 left-20 text-6xl opacity-5 animate-pulse delay-1000">🍜</div>
        <div className="absolute bottom-20 right-32 text-6xl opacity-5 animate-pulse delay-700">🌮</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        {/* Navigation */}
        <nav className={`flex items-center justify-between mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-black">Infybite</span>
          </div>
          
          {/* <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-black hover:text-gray-600 transition-colors">For Vendors</a>
            <a href="#" className="text-sm font-medium text-black hover:text-gray-600 transition-colors">For Customers</a>
            <a href="#howitworks" className="text-sm font-medium text-black hover:text-gray-600 transition-colors">How it Works</a>
          </div> */}
          
          <a href="/login" className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-105">
            Login
          </a>
        </nav>

        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mt-12">
          {/* Left Column - Text Content */}
          <div>
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Store className="w-4 h-4" />
              <span className="text-sm font-medium">Live Menu Updates</span>
            </div>

            {/* Main Heading */}
            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black mb-6 leading-tight transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              No More
              <br />
              <span className="relative inline-block">
                Whiteboard
                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-black opacity-10" />
              </span>
              <br />
              Menus
            </h1>

            {/* Subheading */}
            <p className={`text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              Check what's available at your favorite food court from anywhere. 
              Save time, avoid disappointment.
            </p>

            {/* Feature List */}
            <div className={`space-y-4 mb-10 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg text-gray-700">Real-time menu availability updates</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg text-gray-700">Check menus before visiting the food court</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <Menu className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg text-gray-700">Browse all vendors in one place</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <a  href="/user/dashboard" className="group px-8 py-4 bg-black text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-2">
                View Live Menus
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <a href="/vendor/dashboard" className="group px-8 py-4 bg-white text-black text-lg font-semibold rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 flex items-center gap-2">
                <Store className="w-5 h-5" />
                I'm a Vendor
              </a>
            </div>
          </div>

          {/* Right Column - Visual Mockup */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative">
              {/* Phone Mockup */}
              <div className="bg-black rounded-[3rem] p-3 shadow-2xl mx-auto max-w-sm">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Phone Screen Content */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Food Court</div>
                        <div className="text-xl font-bold text-black">Campus Plaza</div>
                      </div>
                      <Smartphone className="w-6 h-6 text-black" />
                    </div>

                    {/* Available Now Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-xs font-medium mb-6">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Live Menu
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-3">
                      {/* Vendor 1 */}
                      <div className="p-4 border-2 border-black rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-black">Pizza Corner</div>
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium text-black mb-1 overflow-hidden" style={{ height: '24px' }}>
                            {foodItems[currentFood]} Available
                          </div>
                          <div className="text-xs">₹150 - ₹300</div>
                        </div>
                      </div>

                      {/* Vendor 2 */}
                      <div className="p-4 bg-black rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white">Burger Hub</div>
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                        </div>
                        <div className="text-sm text-gray-300">
                          <div className="font-medium text-white mb-1">Burgers & Fries</div>
                          <div className="text-xs">₹120 - ₹250</div>
                        </div>
                      </div>

                      {/* Vendor 3 */}
                      <div className="p-4 border-2 border-black rounded-2xl opacity-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-black">Noodle House</div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium text-black mb-1">Closed Today</div>
                          <div className="text-xs">Opens Tomorrow</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -left-4 top-20 bg-white border-2 border-black rounded-2xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-black">15+</div>
                <div className="text-xs text-gray-600 font-medium">Vendors</div>
              </div>

              <div className="absolute -right-4 bottom-32 bg-black rounded-2xl p-4 shadow-xl">
                <div className="text-2xl font-bold text-white">Live</div>
                <div className="text-xs text-gray-300 font-medium">Updates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfybiteHero;