import type { AgentQueryRequest, AgentQueryResponse } from "@/types";
import { USE_MOCKS, request } from "./client";
import { mockPostAgentQuery } from "@/mocks/data";

export function postAgentQuery(body: AgentQueryRequest): Promise<AgentQueryResponse> {
  if (USE_MOCKS) return mockPostAgentQuery(body);
  return request<AgentQueryResponse>("/agent/query", { method: "POST", body: JSON.stringify(body) });
}
