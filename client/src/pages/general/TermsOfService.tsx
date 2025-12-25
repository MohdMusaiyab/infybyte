import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Footer from "../../components/general/Footer";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <>
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 group transition-colors">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2 flex items-center gap-3">
          Terms of Service
        </h1>
        <p className="text-gray-600">Please read these terms carefully before using our platform.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-sm space-y-10">
        <div className="flex gap-4">
          <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">01</div>
          <div>
            <h3 className="text-lg font-bold text-black mb-2">User Accounts</h3>
            <p className="text-gray-600 leading-relaxed">
              Vendors are responsible for maintaining the confidentiality of their account credentials 
              and for all activities that occur under their account, including manager assignments.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">02</div>
          <div>
            <h3 className="text-lg font-bold text-black mb-2">Acceptable Use</h3>
            <p className="text-gray-600 leading-relaxed">
              You agree not to misuse the food court management system or help anyone else do so. 
              Unauthorized access to other vendors' data is strictly prohibited.
            </p>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-100 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">
            <strong>Termination:</strong> We reserve the right to suspend or terminate access to our 
            services for users who violate these terms or engage in fraudulent activity.
          </p>
        </div>
      </div>
    </div>
    <Footer></Footer>
    </>

  );
};

export default TermsOfService;