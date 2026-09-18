import type { SessionHistory, SessionSummary } from "@/types";
import { USE_MOCKS, request } from "./client";
import { mockGetSessionHistory, mockListSessions } from "@/mocks/data";

export function getSessionHistory(sessionId: string): Promise<SessionHistory> {
  if (USE_MOCKS) return mockGetSessionHistory(sessionId);
  return request<SessionHistory>(`/session/${sessionId}/history`);
}

/** Dashboard helper (not in the supplied contract) — lists recent sessions for the admin viewer. */
export function listSessions(): Promise<SessionSummary[]> {
  if (USE_MOCKS) return mockListSessions();
  return request<SessionSummary[]>(`/session`);
}
