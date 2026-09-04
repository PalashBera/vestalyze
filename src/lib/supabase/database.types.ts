export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          display_currency: "INR" | "USD";
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          display_currency?: "INR" | "USD";
          created_at?: string;
        };
        Update: {
          name?: string;
          display_currency?: "INR" | "USD";
        };
        Relationships: [];
      };
      securities: {
        Row: {
          id: string;
          company_name: string;
          standardized_name: string;
          ticker: string;
          isin: string | null;
          exchange: string;
          country: "IN" | "US";
          currency: "INR" | "USD";
          sector: string;
          industry: string;
        };
        Insert: Database["public"]["Tables"]["securities"]["Row"];
        Update: Partial<Database["public"]["Tables"]["securities"]["Row"]>;
        Relationships: [];
      };
      funds: {
        Row: {
          id: string;
          name: string;
          symbol: string;
          type: "mutual_fund" | "etf";
          fund_house: string;
          category: string;
          country: "IN" | "US";
          currency: "INR" | "USD";
          latest_portfolio_date: string;
          source_website: string;
          source_url: string;
          last_scraped_at: string;
          data_status: "fresh" | "stale" | "failed" | "pending";
        };
        Insert: Database["public"]["Tables"]["funds"]["Row"];
        Update: Partial<Database["public"]["Tables"]["funds"]["Row"]>;
        Relationships: [];
      };
      fund_holdings: {
        Row: {
          id: string;
          fund_id: string;
          security_id: string;
          allocation_percentage: number;
          holding_date: string;
          shares: number | null;
          market_value: number | null;
          source_id: string;
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
          currency: "INR" | "USD";
          invested_amount: number;
          current_value: number;
          units: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fund_id?: string | null;
          security_id?: string | null;
          name: string;
          type: "mutual_fund" | "etf" | "stock";
          country: "IN" | "US";
          currency: "INR" | "USD";
          invested_amount: number;
          current_value: number;
          units?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          invested_amount?: number;
          current_value?: number;
          units?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_transactions: {
        Row: {
          id: string;
          investment_id: string;
          transaction_date: string;
          units: number | null;
          purchase_price: number | null;
          invested_amount: number;
        };
        Insert: {
          id?: string;
          investment_id: string;
          transaction_date: string;
          units?: number | null;
          purchase_price?: number | null;
          invested_amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["investment_transactions"]["Row"]>;
        Relationships: [];
      };
      data_sources: {
        Row: {
          id: string;
          name: string;
          url: string;
          type: "indian_mf" | "indian_etf" | "us_etf" | "factsheet";
          last_scraped_at: string;
          last_successful_at: string | null;
          status: "fresh" | "stale" | "failed" | "pending";
        };
        Insert: Database["public"]["Tables"]["data_sources"]["Row"];
        Update: Partial<Database["public"]["Tables"]["data_sources"]["Row"]>;
        Relationships: [];
      };
      scraping_logs: {
        Row: {
          id: string;
          data_source_id: string;
          started_at: string;
          completed_at: string | null;
          status: "success" | "failed" | "running";
          records_processed: number;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          data_source_id: string;
          started_at?: string;
          completed_at?: string | null;
          status: "success" | "failed" | "running";
          records_processed?: number;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["scraping_logs"]["Row"]>;
        Relationships: [];
      };
      fx_rates: {
        Row: {
          base: "INR" | "USD";
          quote: "INR" | "USD";
          rate: number;
          as_of: string;
        };
        Insert: Database["public"]["Tables"]["fx_rates"]["Row"];
        Update: Partial<Database["public"]["Tables"]["fx_rates"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      clone_sample_portfolio: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
