import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  fetchUsageLogs,
  UsageRecord,
  UsageStats,
} from "../services/adminService";

const AdminPage: React.FC = () => {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async (appendKey?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsageLogs(50, appendKey);
      if (appendKey) {
        setRecords((prev) => [...prev, ...data.items]);
      } else {
        setRecords(data.items);
      }
      setStats(data.stats);
      setLastKey(data.lastEvaluatedKey);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load usage data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;

  return (
    <div className="min-h-screen bg-ot-900 text-slate-200 pb-20 font-sans">
      {/* Header */}
      <header className="bg-ot-800 border-b border-ot-700 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center shadow-lg shadow-purple-600/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Admin <span className="text-purple-400">Usage Dashboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-slate-400 hover:text-white bg-ot-900 border border-ot-700 hover:border-ot-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Back to App
            </button>
            {user && (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-ot-700">
                <span className="text-xs text-slate-300 hidden sm:block">
                  {user.givenName} {user.familyName}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-white bg-ot-900 border border-ot-700 hover:border-ot-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg text-center">
              <h3 className="text-purple-400 font-medium text-xs uppercase tracking-wider mb-2">
                Total Reports
              </h3>
              <p className="text-3xl font-bold text-white font-mono">
                {stats.recordCount}
              </p>
            </div>
            <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg text-center">
              <h3 className="text-purple-400 font-medium text-xs uppercase tracking-wider mb-2">
                Total Cost
              </h3>
              <p className="text-3xl font-bold text-white font-mono">
                {formatCost(stats.totalCost)}
              </p>
            </div>
            <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg text-center">
              <h3 className="text-purple-400 font-medium text-xs uppercase tracking-wider mb-2">
                Input Tokens
              </h3>
              <p className="text-3xl font-bold text-white font-mono">
                {stats.totalInputTokens.toLocaleString()}
              </p>
            </div>
            <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg text-center">
              <h3 className="text-purple-400 font-medium text-xs uppercase tracking-wider mb-2">
                Output Tokens
              </h3>
              <p className="text-3xl font-bold text-white font-mono">
                {stats.totalOutputTokens.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Usage Table */}
        <div className="bg-ot-800 border border-ot-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-ot-700">
            <h2 className="text-lg font-semibold text-white">
              Report Generation Log
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              All Bedrock Claude Sonnet 4 API calls from "Generate Report"
            </p>
          </div>

          {error && (
            <div className="m-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-xs">
              {error}
            </div>
          )}

          {isLoading && records.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="animate-spin h-8 w-8 text-purple-400 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-slate-400 text-sm">Loading usage data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-slate-400 bg-ot-900/50">
                  <tr>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3 text-right">Input Tokens</th>
                    <th className="px-6 py-3 text-right">Output Tokens</th>
                    <th className="px-6 py-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-ot-700 hover:bg-ot-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {record.email}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {record.company}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {formatTimestamp(record.timestamp)}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-slate-300">
                        {record.inputTokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-slate-300">
                        {record.outputTokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-ot-accent font-bold">
                        {formatCost(record.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {records.length === 0 && !isLoading && (
                <div className="p-12 text-center text-slate-500">
                  No usage records found yet. Records will appear here after
                  users generate reports.
                </div>
              )}
            </div>
          )}

          {lastKey && (
            <div className="p-4 border-t border-ot-700 text-center">
              <button
                onClick={() => loadUsage(lastKey)}
                disabled={isLoading}
                className="text-sm text-purple-400 hover:text-purple-300 font-medium"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
