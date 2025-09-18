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
  refresh_token: string;
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
  role: string;
}

export interface RegisterResponse {
  user: User;
}