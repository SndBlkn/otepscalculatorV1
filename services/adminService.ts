import { getIdToken } from "../auth/authService";

export interface UsageRecord {
  email: string;
  timestamp: string;
  company: string;
  title: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  totalEps: number;
  deviceCount: number;
}

export interface UsageStats {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  recordCount: number;
}

export interface AdminUsageResponse {
  items: UsageRecord[];
  stats: UsageStats;
  lastEvaluatedKey: string | null;
}

export const fetchUsageLogs = async (
  limit: number = 50,
  lastKey?: string
): Promise<AdminUsageResponse> => {
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  if (!apiEndpoint) {
    throw new Error("API endpoint not configured.");
  }

  const token = await getIdToken();
  if (!token) {
    throw new Error("Not authenticated. Please sign in again.");
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (lastKey) {
    params.append("lastKey", lastKey);
  }

  const response = await fetch(`${apiEndpoint}/admin/usage?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  });

  if (response.status === 403) {
    throw new Error("Access denied. Admin privileges required.");
  }

  if (response.status === 401) {
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API error: ${response.status}`);
  }

  return await response.json();
};
