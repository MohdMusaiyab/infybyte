import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Eye } from "lucide-react";
import Footer from "../../components/general/Footer";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <>
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 group transition-colors"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2">Privacy Policy</h1>
        <p className="text-gray-600">Last updated: December 25, 2025</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-sm space-y-8">
        <section>
          <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" /> 1. Information We Collect
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We collect information you provide directly to us when you create an
            account, such as your name, email address, and contact number. For
            food court managers, we also store assignment data related to
            specific locations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6" /> 2. How We Use Information
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>To provide, maintain, and improve our services.</li>
            <li>To manage food court assignments and vendor operations.</li>
            <li>To send technical notices, updates, and security alerts.</li>
          </ul>
        </section>

        <section className="bg-gray-50 p-6 rounded-xl border-2 border-gray-100">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6" /> 3. Data Security
          </h2>
          <p className="text-gray-600 leading-relaxed">
            We use industry-standard encryption and security measures to protect
            your data. Access to manager records is strictly limited to
            authorized vendors and administrators.
          </p>
        </section>
      </div>
      
    </div>
    <Footer/>
    </>
  );
};

export default PrivacyPolicy;
