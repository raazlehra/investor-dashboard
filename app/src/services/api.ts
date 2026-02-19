import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  AuthResponse, 
  PortfolioResponse, 
  SharePriceResponse,
  AdminUsersResponse,
  AdminHoldingsResponse,
  ApiError 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  validateToken: async (): Promise<AuthResponse> => {
    const response = await api.get('/auth/validate');
    return response.data;
  },

  getProfile: async (): Promise<AuthResponse> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Investor API
export const investorApi = {
  getPortfolio: async (): Promise<PortfolioResponse> => {
    const response = await api.get('/investor/portfolio');
    return response.data;
  },

  getHoldingDetails: async (id: number): Promise<PortfolioResponse> => {
    const response = await api.get(`/investor/portfolio/${id}`);
    return response.data;
  },

  getSharePrices: async (): Promise<SharePriceResponse> => {
    const response = await api.get('/investor/share-prices');
    return response.data;
  },
};

// Admin API
export const adminApi = {
  // Users
  getAllUsers: async (): Promise<AdminUsersResponse> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getUserById: async (id: number): Promise<AdminUsersResponse> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    password: string;
    role: string;
    company_name?: string;
    firm_name?: string;
  }): Promise<AdminUsersResponse> => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: {
    is_active?: boolean;
    password?: string;
  }): Promise<AdminUsersResponse> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Share Prices
  getAllSharePrices: async (): Promise<SharePriceResponse> => {
    const response = await api.get('/admin/share-prices');
    return response.data;
  },

  createSharePrice: async (data: {
    share_name: string;
    current_price: number;
  }): Promise<SharePriceResponse> => {
    const response = await api.post('/admin/share-prices', data);
    return response.data;
  },

  updateSharePrice: async (id: number, data: {
    current_price: number;
  }): Promise<SharePriceResponse> => {
    const response = await api.put(`/admin/share-prices/${id}`, data);
    return response.data;
  },

  deleteSharePrice: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/share-prices/${id}`);
    return response.data;
  },

  // Holdings
  getAllHoldings: async (): Promise<AdminHoldingsResponse> => {
    const response = await api.get('/admin/holdings');
    return response.data;
  },

  createHolding: async (data: {
    user_id: number;
    company_name: string;
    firm_name: string;
    share_name: string;
    share_quantity: number;
    buy_price: number;
  }): Promise<AdminHoldingsResponse> => {
    const response = await api.post('/admin/holdings', data);
    return response.data;
  },

  updateHolding: async (id: number, data: {
    share_quantity?: number;
    buy_price?: number;
  }): Promise<AdminHoldingsResponse> => {
    const response = await api.put(`/admin/holdings/${id}`, data);
    return response.data;
  },

  deleteHolding: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/holdings/${id}`);
    return response.data;
  },
};

export default api;
