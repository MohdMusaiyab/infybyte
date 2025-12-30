import React from "react";
import { ChefHat } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <div className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-bold text-white">Infybite</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md text-lg">
              Transforming food court experiences with real-time digital menus.
              No more whiteboards, no more wasted trips.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-0 md:col-span-2">
            <div>
              <h3 className="text-white font-semibold mb-4 text-lg">Product</h3>
              <ul className="space-y-3">
                {[
                  "For Vendors",
                  "For Food Courts",
                  "Features",
                  "How It Works",
                  "Pricing",
                ]?.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors text-base"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-lg">Company</h3>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact", "Help Center"]?.map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors text-base"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm text-center sm:text-left">
              © 2025 Infybite. All rights reserved.
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"]?.map(
                (item) => (
                  <a
                    key={item}
                    href={"/" + item.toLowerCase().replace(/\s+/g, "-")}
                    className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {item}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
