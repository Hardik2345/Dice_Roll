// api.tsx - Admin Dashboard API Service
import axios, { AxiosInstance, AxiosError } from "axios";

// Type definitions for admin API responses
interface HealthResponse {
  status: string;
  mongodb: string;
  shopify: string;
  timestamp: string;
  error?: string;
}

interface DashboardUser {
  _id?: string;
  name: string;
  discountCode: string;
  playedAt?: string;
  enteredOTPAt?: string;
  rollDiceAt?: string;
  discountUsedAt?: string;
}

interface DashboardStats {
  entered: { count: number; users: DashboardUser[] };
  verified: { count: number; users: DashboardUser[] };
  rolled: { count: number; users: DashboardUser[] };
  usedDiscount: { count: number; users: DashboardUser[] };
}

// Extend AxiosError to include custom properties
interface CustomAxiosError extends AxiosError {
  friendlyMessage?: string;
}

// Admin model interface
export interface Admin { id: string; username: string; email: string; role: string; lastLogin: string; }

// Authentication methods
export const login = (username: string, password: string) =>
  api.post<{ success: boolean; admin: Admin }>("/api/admin/login", { username, password });

export const logout = () =>
  api.post<{ success: boolean }>("/api/admin/logout");

export const getAdminStatus = () =>
  api.get<{ authenticated: boolean; admin?: Admin }>("/api/admin/status");

// API URL configuration
const API_URL: string = "https://dice-roll-l2qy.onrender.com";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error: AxiosError) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.data);
    return response;
  },
  (error: CustomAxiosError) => {
    console.error(
      "API Response Error:",
      error.response?.status,
      error.response?.data
    );
    return Promise.reject(error);
  }
);

// API service object with only admin methods
const apiService = {
  getHealth: () => api.get<HealthResponse>("/api/health"),

  getDashboardStats: (startDate: string, endDate: string) =>
    api.get<DashboardStats>("/api/admin/dashboard-stats", {
      params: { startDate, endDate },
    }),

  // Mark discount as used
  markDiscountUsed: (discountCode: string) =>
    api.post<{ success: boolean; message: string }>("/api/mark-discount-used", {
      discountCode,
    }),

  // Admin authentication methods
  login: (username: string, password: string) =>
    api.post<{ success: boolean; admin: Admin }>("/api/admin/login", { username, password }),

  logout: () => api.post<{ success: boolean }>("/api/admin/logout"),

  getAdminStatus: () => api.get<{ authenticated: boolean; admin?: Admin }>("/api/admin/status"),
  // Alias for backward compatibility
  getStatus: () => api.get<{ authenticated: boolean; admin?: Admin }>("/api/admin/status"),
};

// Export types for use in components
export type {
  HealthResponse,
  CustomAxiosError,
  DashboardUser,
  DashboardStats,
};

export default apiService;
