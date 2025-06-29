import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";

const API_BASE = "https://dice-roll-admin.onrender.com";

const TABS = [
  { key: "entered", label: "Entered" },
  { key: "otp_sent", label: "OTP Sent" },
  { key: "otp_verified", label: "Verified OTP" },
  { key: "dice_rolled", label: "Rolled Dice" },
  { key: "discount_used", label: "Used Discount" },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

interface FunnelEvent {
  _id: string;
  mobile: string;
  eventType: string;
  timestamp: string;
  userId?: string;
  name?: string;
}

interface FunnelStats {
  [eventType: string]: { count: number; events: FunnelEvent[] };
}

const AdminFunnelDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [mobileSearch, setMobileSearch] = useState<string>("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/admin/funnel-stats`, {
        params: { startDate, endDate, mobile: mobileSearch, t: Date.now() },
      });
      setStats(res.data);
    } catch (err) {
      setError(
        (err as unknown as { response?: { data?: { error?: string } } })
          ?.response?.data?.error || "Failed to fetch stats"
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, mobileSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const socket: Socket = io("https://dice-roll-admin.onrender.com", {
      transports: ["websocket"],
    });
    socket.on("funnelEventUpdate", () => {
      fetchStats();
    });
    return () => {
      socket.disconnect();
    };
  }, [fetchStats]);

  const renderTable = (events: FunnelEvent[]) => (
    <table className="min-w-full border mt-4">
      <thead>
        <tr>
          <th className="border px-2 py-1">#</th>
          <th className="border px-2 py-1">Name</th>
          <th className="border px-2 py-1">Mobile</th>
          <th className="border px-2 py-1">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e, i) => (
          <tr key={e._id}>
            <td className="border px-2 py-1">{i + 1}</td>
            <td className="border px-2 py-1">{e.name || "-"}</td>
            <td className="border px-2 py-1">{e.mobile}</td>
            <td className="border px-2 py-1">{formatDate(e.timestamp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Funnel Dashboard</h1>
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-sm">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
            max={endDate}
          />
        </div>
        <div>
          <label className="block text-sm">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
            min={startDate}
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <label className="block text-sm">Search Mobile</label>
          <input
            type="text"
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            placeholder="Enter mobile number"
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
          <div className="font-semibold mb-2">
            Total {TABS.find((t) => t.key === activeTab)?.label}:{" "}
            {stats[activeTab]?.count || 0}
          </div>
          {renderTable(stats[activeTab]?.events || [])}
        </div>
      )}
    </div>
  );
};

export default AdminFunnelDashboard;
