import React from 'react';
import { ArrowRight, Store } from 'lucide-react';

const FinalCTA: React.FC = () => {
  return (
    <div className="relative bg-white py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Floating Icons */}
        <div className="absolute top-10 left-10 text-6xl opacity-5 animate-pulse">🚀</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-5 animate-pulse delay-500">🎯</div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Main CTA Card */}
        <div className="bg-black rounded-3xl p-12 border-2 border-black">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Food Court Experience?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join the digital revolution. No more whiteboard menus, no more wasted trips.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="group px-8 py-4 bg-white text-black text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="group px-8 py-4 bg-transparent text-white text-lg font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 flex items-center gap-2">
              <Store className="w-5 h-5" />
              Vendor Demo
            </button>
          </div>

          {/* Trust Text */}
          <p className="text-gray-400 text-sm mt-6">
            No credit card required • Setup in 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinalCTA;