export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          display_currency: "INR" | "USD";
          fx_usd_inr: number;
          fx_as_of: string;
          target_profit_percentage: number | null;
          target_loss_percentage: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          display_currency?: "INR" | "USD";
          fx_usd_inr?: number;
          fx_as_of?: string;
          target_profit_percentage?: number | null;
          target_loss_percentage?: number | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          display_currency?: "INR" | "USD";
          fx_usd_inr?: number;
          fx_as_of?: string;
          target_profit_percentage?: number | null;
          target_loss_percentage?: number | null;
        };
        Relationships: [];
      };
      securities: {
        Row: {
          id: string;
          user_id: string;
          standardized_name: string;
          ticker: string;
          country: "IN" | "US";
        };
        Insert: Database["public"]["Tables"]["securities"]["Row"];
        Update: Partial<Database["public"]["Tables"]["securities"]["Row"]>;
        Relationships: [];
      };
      funds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "mutual_fund" | "etf";
          country: "IN" | "US";
          latest_portfolio_date: string;
          source_url: string;
        };
        Insert: Database["public"]["Tables"]["funds"]["Row"];
        Update: Partial<Database["public"]["Tables"]["funds"]["Row"]>;
        Relationships: [];
      };
      fund_holdings: {
        Row: {
          id: string;
          user_id: string;
          fund_id: string;
          security_id: string;
          allocation_percentage: number;
        };
        Insert: Database["public"]["Tables"]["fund_holdings"]["Row"];
        Update: Partial<Database["public"]["Tables"]["fund_holdings"]["Row"]>;
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          fund_id: string | null;
          security_id: string | null;
          name: string;
          type: "mutual_fund" | "etf" | "stock";
          country: "IN" | "US";
          invested_amount: number;
          source_url: string | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fund_id?: string | null;
          security_id?: string | null;
          name: string;
          type: "mutual_fund" | "etf" | "stock";
          country: "IN" | "US";
          invested_amount: number;
          source_url?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          invested_amount?: number;
          source_url?: string | null;
          last_synced_at?: string | null;
          fund_id?: string | null;
        };
        Relationships: [];
      };
      investment_syncs: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          started_at: string;
          status: "success" | "failed" | "running";
          records_processed: number;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          started_at?: string;
          status: "success" | "failed" | "running";
          records_processed?: number;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["investment_syncs"]["Row"]>;
        Relationships: [];
      };
      stock_trades: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          buy_date: string;
          buy_price: number;
          quantity: number;
          sell_date: string | null;
          sell_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          buy_date: string;
          buy_price: number;
          quantity: number;
          sell_date?: string | null;
          sell_price?: number | null;
          created_at?: string;
        };
        Update: {
          symbol?: string;
          buy_date?: string;
          buy_price?: number;
          quantity?: number;
          sell_date?: string | null;
          sell_price?: number | null;
        };
        Relationships: [];
      };
      stock_analysis: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          buy_date: string;
          buy_price: number;
          target_return_percentage: number;
          exited_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          buy_date: string;
          buy_price: number;
          target_return_percentage: number;
          exited_date?: string | null;
          created_at?: string;
        };
        Update: {
          symbol?: string;
          buy_date?: string;
          buy_price?: number;
          target_return_percentage?: number;
          exited_date?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
