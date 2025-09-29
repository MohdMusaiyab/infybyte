// // src/store/auth.ts
// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import type { User } from "../types/auth";

// interface AuthState {
//   user: User | null;
//   accessToken: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   setAuth: (user: User, token: string) => void;
//   setUser: (user: User, token: string) => void;
//   setLoading: (loading: boolean) => void;
//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       user: null,
//       accessToken: null,
//       isAuthenticated: false,
//       isLoading: false,

//       setAuth: (user, token) =>
//         set({
//           user,
//           accessToken: token,
//           isAuthenticated: true,
//         }),

//       setUser: (user, token) =>
//         set({
//           user,
//           accessToken: token,
//           isAuthenticated: true,
//         }),

//       setLoading: (loading) => set({ isLoading: loading }),

//       logout: () =>
//         set({
//           user: null,
//           accessToken: null,
//           isAuthenticated: false,
//         }),
//     }),
//     {
//       name: "auth-storage", // key in localStorage
//     }
//   )
// );

import { create } from "zustand";
import { persist } from "zustand/middleware";
// import type { User } from "../types/auth";
import type { AuthState } from "../types/auth";

// interface AuthState {
//   user: User | null;
//   accessToken: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   setAuth: (user: User, token: string) => void;
//   setUser: (user: User, token: string) => void;
//   setLoading: (loading: boolean) => void;
//   logout: () => void;
// }

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token) =>
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        }),

      setUser: (user, token) =>
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
      }),
    }
  )
);

