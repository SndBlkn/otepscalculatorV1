import { OTDeviceCategory, CalculationResult } from "../types";
import { getIdToken } from "../auth/authService";

export const analyzeInfrastructure = async (
  devices: OTDeviceCategory[],
  results: CalculationResult
) => {
  try {
    const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
    if (!apiEndpoint) {
      throw new Error("API endpoint not configured. Please set VITE_API_ENDPOINT.");
    }

    const token = await getIdToken();
    if (!token) {
      throw new Error("Not authenticated. Please sign in again.");
    }

    const response = await fetch(`${apiEndpoint}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ devices, results }),
    });

    if (response.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};
