export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface FoodCourt {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
  timings?: string;
  weekdays?: boolean;
  weekends?: boolean;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  foodcourts?: FoodCourt[];
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User, token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}