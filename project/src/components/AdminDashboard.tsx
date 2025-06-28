import React, { useEffect, useState } from "react";
import apiService, { DashboardStats, DashboardUser } from "../services/api";

const TABS = [
  { key: "entered", label: "Entered" },
  { key: "verified", label: "Verified OTP" },
  { key: "rolled", label: "Rolled Dice" },
  { key: "usedDiscount", label: "Used Discount" },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

const AdminDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getDashboardStats(startDate, endDate);
      setStats(res.data);
    } catch (err) {
      setError(
        (err as unknown as { response?: { data?: { error?: string } } })
          ?.response?.data?.error || "Failed to fetch stats"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const renderTable = (users: DashboardUser[], field: keyof DashboardUser) => (
    <table className="min-w-full border mt-4">
      <thead>
        <tr>
          <th className="border px-2 py-1">#</th>
          <th className="border px-2 py-1">Name</th>
          <th className="border px-2 py-1">Discount Code</th>
          <th className="border px-2 py-1">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u, i) => (
          <tr key={u._id || i}>
            <td className="border px-2 py-1">{i + 1}</td>
            <td className="border px-2 py-1">{u.name}</td>
            <td className="border px-2 py-1">{u.discountCode}</td>
            <td className="border px-2 py-1">
              {formatDate(u[field] as string)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={fetchStats}
          className="bg-blue-600 text-white px-4 py-2 rounded self-end"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-t ${
              activeTab === tab.key ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {stats && (
        <div>
          {activeTab === "entered" && (
            <div>
              <div className="font-semibold mb-2">
                Total Entered: {stats.entered.count}
              </div>
              {renderTable(stats.entered.users, "playedAt")}
            </div>
          )}
          {activeTab === "verified" && (
            <div>
              <div className="font-semibold mb-2">
                Total Verified OTP: {stats.verified.count}
              </div>
              {renderTable(stats.verified.users, "enteredOTPAt")}
            </div>
          )}
          {activeTab === "rolled" && (
            <div>
              <div className="font-semibold mb-2">
                Total Rolled Dice: {stats.rolled.count}
              </div>
              {renderTable(stats.rolled.users, "rollDiceAt")}
            </div>
          )}
          {activeTab === "usedDiscount" && (
            <div>
              <div className="font-semibold mb-2">
                Total Used Discount: {stats.usedDiscount.count}
              </div>
              {renderTable(stats.usedDiscount.users, "discountUsedAt")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
