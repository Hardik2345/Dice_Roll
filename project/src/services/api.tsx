// api.tsx
import axios, { AxiosInstance, AxiosError } from "axios";

// Type definitions for API requests and responses
interface SendOTPRequest {
  name: string;
  mobile: string;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  debug?: string;
  error?: string;
  alreadyPlayed?: boolean;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface RollDiceResponse {
  success: boolean;
  diceResult: number;
  discountCode: string;
  discount: string;
  shopifyUrl: string | null;
  isShopifyCode: boolean;
  message: string;
  error?: string;
  alreadyPlayed?: boolean;
}

interface StatusResponse {
  verified: boolean;
  userInfo: {
    name: string;
    mobile: string;
  } | null;
}

interface DiscountStatusResponse {
  code: string;
  usageCount?: number;
  valid: boolean;
  isShopifyCode: boolean;
  message?: string;
  error?: string;
}

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

// API URL configuration
const API_URL: string = "https://dice-roll-admin.onrender.com";

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

// API service object with typed methods
const apiService = {
  sendOTP: (data: SendOTPRequest) =>
    api.post<SendOTPResponse>("/api/send-otp", data),

  verifyOTP: (otp: string) =>
    api.post<VerifyOTPResponse>("/api/verify-otp", {
      otp,
    }),

  rollDice: () => api.post<RollDiceResponse>("/api/roll-dice"),

  getStatus: () => api.get<StatusResponse>("/api/status"),

  checkDiscountStatus: (code: string) =>
    api.get<DiscountStatusResponse>(`/api/discount-status/${code}`),

  getHealth: () => api.get<HealthResponse>("/api/health"),

  getDashboardStats: (startDate: string, endDate: string) =>
    api.get<DashboardStats>("/api/admin/dashboard-stats", {
      params: { startDate, endDate },
    }),
};

// Export types for use in components
export type {
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPResponse,
  RollDiceResponse,
  StatusResponse,
  DiscountStatusResponse,
  HealthResponse,
  CustomAxiosError,
  DashboardUser,
  DashboardStats,
};

export default apiService;
