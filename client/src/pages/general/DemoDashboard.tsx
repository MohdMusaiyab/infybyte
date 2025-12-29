import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Store, 
  User, 
  Search, 
  ChefHat, 
  Zap, 
  Clock, 
  Ban,
  Check,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: 'breakfast' | 'maincourse' | 'dessert' | 'beverage' | 'dosa' | 'northmeal' | 'paratha' | 'chinese' | 'combo';
  isVeg: boolean;
  isSpecial: boolean;
}
interface ItemFoodCourt {
  id: string; 
  item: Item; 
  status: 'available' | 'notavailable' | 'sellingfast' | 'finishingsoon';
  isActive: boolean; 
  timeSlot: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
}

// --- Mock Data ---
const MOCK_ITEMS: ItemFoodCourt[] = [
  {
    id: "fc_1",
    status: "available",
    isActive: true,
    timeSlot: "lunch",
    item: {
      id: "it_1",
      name: "Special Masala Dosa",
      description: "Crispy rice crepe filled with spiced potato masala, served with chutney and sambar.",
      basePrice: 120,
      category: "dosa",
      isVeg: true,
      isSpecial: true
    }
  },
  {
    id: "fc_2",
    status: "sellingfast",
    isActive: true,
    timeSlot: "lunch",
    item: {
      id: "it_2",
      name: "Chicken Biryani Combo",
      description: "Aromatic basmati rice cooked with tender chicken, served with raita and salan.",
      basePrice: 250,
      category: "combo",
      isVeg: false,
      isSpecial: false
    }
  },
  {
    id: "fc_3",
    status: "notavailable",
    isActive: true,
    timeSlot: "dinner",
    item: {
      id: "it_3",
      name: "Paneer Butter Masala Bowl",
      description: "Rich tomato gravy with cottage cheese cubes served over jeera rice.",
      basePrice: 180,
      category: "northmeal",
      isVeg: true,
      isSpecial: false
    }
  },
  {
    id: "fc_4",
    status: "available",
    isActive: false, 
    timeSlot: "lunch",
    item: {
      id: "it_4",
      name: "Seasonal Fruit Juice",
      description: "Freshly pressed watermelon juice.",
      basePrice: 80,
      category: "beverage",
      isVeg: true,
      isSpecial: false
    }
  }
];

const DemoDashboard: React.FC = () => {
  const [items, setItems] = useState<ItemFoodCourt[]>(MOCK_ITEMS);
  const [viewMode, setViewMode] = useState<'vendor' | 'user'>('vendor');

  const handleStatusChange = (id: string, newStatus: ItemFoodCourt['status']) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const handleActiveToggle = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
     
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
         
          <div className="flex items-center gap-4">
           
            <a href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight tracking-tight">Demo Food Court</h1>
                  <p className="text-xs text-gray-500 font-medium">Dashboard</p>
                </div>
            </div>
          </div>

          
          <div className="self-start md:self-auto bg-gray-100 p-1 rounded-xl flex w-full md:w-auto">
            <button 
              onClick={() => setViewMode('vendor')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'vendor' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Store className="w-4 h-4" />
              Vendor
            </button>
            <button 
              onClick={() => setViewMode('user')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'user' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User className="w-4 h-4" />
              User
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {viewMode === 'vendor' ? (
          <VendorView 
            items={items} 
            onStatusChange={handleStatusChange} 
            onActiveToggle={handleActiveToggle} 
          />
        ) : (
          <UserView items={items?.filter(i => i.isActive)} /> 
        )}
      </main>
    </div>
  );
};

const VendorView: React.FC<{ 
  items: ItemFoodCourt[], 
  onStatusChange: (id: string, s: ItemFoodCourt['status']) => void,
  onActiveToggle: (id: string) => void
}> = ({ items, onStatusChange, onActiveToggle }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Menu Management</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
          {items.length} Items Total
        </span>
      </div>

    
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg flex items-start gap-4">
        <div className="w-10 h-10 bg-black rounded-full flex-shrink-0 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
            <h3 className="text-lg font-bold text-black mb-1">Boost Revenue, Cut Waste.</h3>
            <p className="text-gray-600 text-sm">
                This dashboard gives you <strong>real-time control</strong> over your inventory. Instantly update the status 
                (e.g., *Selling Fast* or *Finishing Soon*) to encourage quick sales, or mark an item 
                *Not Available* the moment you run out, ensuring <strong>no missed orders</strong> or frustrated customers.
            </p>
        </div>
      </div>
      <div className="grid gap-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`bg-white rounded-xl border p-4 transition-all duration-300 ${!item.isActive ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-gray-200 shadow-sm hover:border-black'}`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              
             
              <div className="flex-grow flex items-start gap-4">
               
                <div className={`mt-1.5 min-w-[16px] h-4 border ${item.item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center p-[2px]`}>
                  <div className={`w-full h-full rounded-full ${item.item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900">{item.item.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="font-medium text-black">₹{item.item.basePrice}</span>
                    <span>•</span>
                    <span className="capitalize">{item.item.category}</span>
                  </div>
                </div>
              </div>

            
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                
                
                <div className="w-full sm:w-auto">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                  <div className="relative">
                    <select 
                      value={item.status}
                      onChange={(e) => onStatusChange(item.id, e.target.value as ItemFoodCourt['status'])}
                      disabled={!item.isActive}
                      className="w-full sm:w-48 appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="available">Available</option>
                      <option value="sellingfast">Selling Fast 🔥</option>
                      <option value="finishingsoon">Finishing Soon ⏳</option>
                      <option value="notavailable">Not Available ❌</option>
                    </select>
                   
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-auto flex flex-col items-start">
                   <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Visibility</label>
                   <button 
                      onClick={() => onActiveToggle(item.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold w-full sm:w-auto justify-center transition-all ${item.isActive ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                   >
                      {item.isActive ? (
                        <>
                          <Check className="w-4 h-4" /> Active
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4" /> Hidden
                        </>
                      )}
                   </button>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserView: React.FC<{ items: ItemFoodCourt[] }> = ({ items }) => {
  return (
    <div className="space-y-6">
      
      <div className="relative max-w-xl mx-auto md:mx-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search Demo Food Court..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg flex items-start gap-4">
        <div className="w-10 h-10 bg-black rounded-full flex-shrink-0 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div>
            <h3 className="text-lg font-bold text-black mb-1">Order with Ease.</h3>
            <p className="text-gray-600 text-sm">
                Never waste time walking to a vendor just to find out your favorite item is sold out. 
                All menus here are <strong>instantly updated</strong> by the kitchen, showing you accurate stock levels and 
                any specials right now.
            </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.map((item) => {
            const isAvailable = item.status !== 'notavailable';
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl p-5 border transition-all duration-300 flex flex-col h-full relative overflow-hidden ${isAvailable ? 'border-gray-100 shadow-sm hover:shadow-md hover:border-black' : 'border-gray-100 opacity-75'}`}
              >
                 <div className="absolute top-4 right-4 z-10">
                    {item.status === 'sellingfast' && (
                        <div className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Selling Fast
                        </div>
                    )}
                    {item.status === 'finishingsoon' && (
                        <div className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Finishing Soon
                        </div>
                    )}
                 </div>
                 <div className="flex justify-between items-start mb-3">
                    <div className={`min-w-[16px] h-4 border ${item.item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center p-[2px]`}>
                        <div className={`w-full h-full rounded-full ${item.item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </div>
                 </div>
                 <div className="flex-grow">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2">{item.item.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.item.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md capitalize">
                            {item.item.category}
                        </span>
                        {item.item.isSpecial && (
                            <span className="text-xs font-bold px-2 py-1 bg-black text-white rounded-md">
                                Today&apos;s Special
                            </span>
                        )}
                    </div>
                 </div>
                 {!isAvailable && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-0 pointer-events-none" />
                 )}
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default DemoDashboard;