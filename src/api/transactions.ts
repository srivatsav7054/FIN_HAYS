import type { Transaction } from "@/types";
import { USE_MOCKS, request } from "./client";
import { mockGetTransactions, mockPostTransaction } from "@/mocks/data";

export function getTransactions(userId: string): Promise<Transaction[]> {
  if (USE_MOCKS) return mockGetTransactions(userId);
  return request<Transaction[]>(`/user/${userId}/transactions`);
}

export function postTransaction(userId: string, tx: Transaction): Promise<Transaction> {
  if (USE_MOCKS) return mockPostTransaction(userId, tx);
  return request<Transaction>(`/user/${userId}/transactions`, { method: "POST", body: JSON.stringify(tx) });
}
