export type LanguageCode = "hi" | "te" | "en";
export type UiLanguage = LanguageCode;

export interface AgentQueryRequest {
  session_id: string;
  text: string;
  language: string;
}

export interface AgentQueryResponse {
  response_text: string;
  sources: string[];
  flagged: boolean;
}

export interface UserProfile {
  user_id: string;
  name: string;
  preferred_language: string;
  phone_number: string;
  monthly_income: number;
  monthly_expenses: number;
  savings_goal: number;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
}

export type TurnRole = "user" | "assistant";

export interface SessionTurn {
  role: TurnRole;
  text: string;
  timestamp: string; // ISO8601
  flagged: boolean;
}

export interface SessionHistory {
  session_id: string;
  turns: SessionTurn[];
}

/** Dashboard-only summary shape derived from session history (not part of the API contract). */
export interface SessionSummary {
  session_id: string;
  language: string;
  started_at: string;
  status: "active" | "completed";
  flagged: boolean;
  turn_count: number;
}

export const TRANSACTION_CATEGORIES = [
  "Groceries",
  "Farming",
  "School Fees",
  "Transport",
  "Healthcare",
  "Other",
] as const;
