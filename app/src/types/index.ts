export interface User {
  id: number;
  username: string;
  role: 'admin' | 'investor';
  is_active?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface Holding {
  id: number;
  company_name: string;
  firm_name: string;
  share_name: string;
  share_quantity: number;
  buy_price: number;
  current_price?: number;
  profit_loss?: number;
  profit_loss_percentage?: number;
  total_value?: number;
  total_cost?: number;
  created_at?: string;
}

export interface PortfolioSummary {
  totalInvestment: number;
  currentValue: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
}

export interface PortfolioResponse {
  success: boolean;
  data?: {
    holdings: Holding[];
    summary: PortfolioSummary;
  };
  message?: string;
}

export interface SharePrice {
  id: number;
  share_name: string;
  current_price: number;
  updated_at: string;
}

export interface SharePriceResponse {
  success: boolean;
  data?: {
    sharePrices: SharePrice[];
  };
  message?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
  holdings_count?: number;
}

export interface AdminUsersResponse {
  success: boolean;
  data?: {
    users: AdminUser[];
  };
  message?: string;
}

export interface AdminHolding {
  id: number;
  user_id: number;
  username: string;
  company_name: string;
  firm_name: string;
  share_name: string;
  share_quantity: number;
  buy_price: number;
  current_price?: number;
  created_at: string;
}

export interface AdminHoldingsResponse {
  success: boolean;
  data?: {
    holdings: AdminHolding[];
  };
  message?: string;
}

export interface ApiError {
  response?: {
    data?: {
      success: boolean;
      message: string;
    };
    status?: number;
  };
  message: string;
}
