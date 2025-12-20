export interface Vendor {
  id: string;
  name: string;
  email: string;
  role: string;
  shopName?: string;
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface FoodCourt {
  id: string;
  name: string;
  location: string;
  timings: string;
  isOpen: boolean;
  weekends: boolean;
  weekdays: boolean;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  foodcourts?: FoodCourt[];
}

export interface FoodItem {
  itemId: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  vendorId: string;
  shopName: string;
  status: string;
  price?: number;
  timeSlot: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isVeg: boolean;
  isSpecial: boolean;
  createdAt: string;
  updatedAt: string;
}