import React, { useState } from 'react';
import { 
  Store, 
  RefreshCw, 
  BarChart3, 
  Users, 
  Shield, 
  Zap, 
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Features: React.FC = () => {
  const [activeTab, setActiveTab] = useState('vendors');

  const features = {
    vendors: [
      {
        icon: RefreshCw,
        title: "One-Click Menu Updates",
        description: "Update availability across all food courts in seconds. No more manual whiteboard rewriting.",
        benefits: ["Save 2-3 hours weekly", "Reduce food waste", "Increase customer satisfaction"]
      },
      {
        icon: Store,
        title: "Multi-Location Management",
        description: "Manage menus for multiple food courts from a single dashboard. Perfect for vendors with multiple stalls.",
        benefits: ["Centralized control", "Consistent branding", "Time-efficient management"]
      },
      {
        icon: BarChart3,
        title: "Sales Analytics",
        description: "Track popular items, peak hours, and customer preferences to optimize your offerings.",
        benefits: ["Data-driven decisions", "Inventory optimization", "Revenue insights"]
      }
    ],
    customers: [
      {
        icon: Zap,
        title: "Real-Time Availability",
        description: "See exactly what's available before you visit. Live status updates every 30 seconds.",
        benefits: ["No wasted trips", "Guaranteed availability", "Time savings"]
      },
      {
        icon: Clock,
        title: "Time Saver",
        description: "Check all vendors in 30 seconds instead of walking through the entire food court.",
        benefits: ["15+ minutes saved per visit", "Better planning", "Reduced crowds"]
      },
      {
        icon: Users,
        title: "Smart Recommendations",
        description: "Get personalized suggestions based on your preferences and current availability.",
        benefits: ["Discover new vendors", "Personalized experience", "Better choices"]
      }
    ],
    admins: [
      {
        icon: Shield,
        title: "Food Court Management",
        description: "Complete dashboard to manage vendors, menus, and platform settings for your food court.",
        benefits: ["Streamlined operations", "Vendor onboarding", "Centralized control"]
      },
      {
        icon: Users,
        title: "Vendor Coordination",
        description: "Easily onboard new vendors and manage existing partnerships with simple tools.",
        benefits: ["Quick setup", "Reduced paperwork", "Better vendor relationships"]
      },
      {
        icon: BarChart3,
        title: "Performance Insights",
        description: "Monitor foot traffic, popular times, and overall food court performance metrics.",
        benefits: ["Data-driven decisions", "Space optimization", "Revenue analysis"]
      }
    ]
  };

  return (
    <div className="relative bg-white py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Floating Icons */}
        <div className="absolute top-20 right-20 text-6xl opacity-5 animate-pulse">📊</div>
        <div className="absolute bottom-32 left-32 text-6xl opacity-5 animate-pulse delay-500">⚡</div>
        <div className="absolute top-1/2 left-20 text-6xl opacity-5 animate-pulse delay-1000">🎯</div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black mb-6">
            Built for Everyone
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive tools designed specifically for food courts, 
            vendors, and hungry customers.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { id: 'vendors', label: 'For Vendors', icon: Store },
            { id: 'customers', label: 'For Customers', icon: Users },
            { id: 'admins', label: 'For Food Courts', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-black text-white border-black shadow-2xl scale-105'
                  : 'bg-white text-black border-black hover:bg-gray-50 hover:scale-105'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${
                activeTab === tab.id ? 'text-white' : 'text-black'
              }`} />
              <span className="text-lg font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
        {(() => {
            interface Feature {
                icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
                title: string;
                description: string;
                benefits: string[];
            }

            type FeaturesByTab = {
                vendors: Feature[];
                customers: Feature[];
                admins: Feature[];
            };

            const typedFeatures = features as FeaturesByTab;
            const tabKey = activeTab as keyof FeaturesByTab;

            return typedFeatures[tabKey].map((feature: Feature, index: number) => (
                <div
                    key={index}
                    className="group bg-white border-2 border-black rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full"
                >
                    {/* Icon */}
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-black mb-4 leading-tight">
                        {feature.title}
                    </h3>
                    
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                        {feature.description}
                    </p>

                    {/* Benefits List */}
                    <div className="space-y-3">
                        {feature.benefits.map((benefit: string, benefitIndex: number) => (
                            <div key={benefitIndex} className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-700 font-medium">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ));
        })()}
        </div>

        {/* Stats Section */}
        <div className="bg-black rounded-3xl p-12 text-center">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "2-3", label: "Hours Saved Weekly per Vendor" },
              { number: "15+", label: "Minutes Saved per Customer Visit" },
              { number: "100%", label: "Real-time Menu Accuracy" },
              { number: "0", label: "Wasted Trips" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-black mb-8">Technical Excellence</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { spec: "Real-time Sync", detail: "WebSocket Connections" },
              { spec: "Mobile First", detail: "PWA & Responsive" },
              { spec: "Secure", detail: "SSL Encryption" },
              { spec: "Fast", detail: "< 2s Load Time" }
            ].map((tech, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="text-lg font-bold text-black mb-2">{tech.spec}</div>
                <div className="text-gray-600 text-sm">{tech.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Ready to bring your food court into the digital age?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/register" className="group px-8 py-4 bg-black text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-2">
              Start Your Journey Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            
            <a href="/demo-dashboard" className="group px-8 py-4 bg-white text-black text-lg font-semibold rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 flex items-center gap-2">
              <Store className="w-5 h-5" />
              View Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;