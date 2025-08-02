import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = "https://dice-roll-l2qy.onrender.com";

const TABS = [
  { key: "entered", label: "Entered" },
  { key: "otp_sent", label: "OTP Sent" },
  { key: "otp_verified", label: "Verified OTP" },
  { key: "dice_rolled", label: "Rolled Dice" },
  { key: "funnel", label: "Funnel" },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

// Helper to convert array of objects into CSV string
function toCSV<T>(items: T[]): string {
  if (!items.length) return "";
  const headers = Object.keys(items[0] as Record<string, any>);
  const rows = items.map(item =>
    headers.map(h => `"${(item as any)[h] || ""}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\r\n");
}

interface FunnelEvent {
  _id: string;
  mobile: string;
  eventType: string;
  timestamp: string;
  userId?: string;
  name?: string;
  discountCode?: string; // Added for discount tracking
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
  const [debouncedMobileSearch, setDebouncedMobileSearch] = useState<string>("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/api/admin/funnel-stats`, {
        withCredentials: true,
        params: { startDate, endDate, mobile: debouncedMobileSearch, t: Date.now() },
      });
      console.log(res.data);
      setStats(res.data);
    } catch (err) {
      setError(
        (err as unknown as { response?: { data?: { error?: string } } })
          ?.response?.data?.error || "Failed to fetch stats"
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, debouncedMobileSearch]);

  // Debounce mobile search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMobileSearch(mobileSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [mobileSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const socket: Socket = io(API_BASE, {
      transports: ["websocket"],
      withCredentials: true,
    });
    socket.on("funnelEventUpdate", () => {
      fetchStats();
    });
    return () => {
      socket.disconnect();
    };
  }, [fetchStats]);

  // Function to render the funnel chart
  const renderFunnelChart = () => {
    if (!stats) return null;

    const funnelData = [
      { label: "Entered", count: stats.entered?.count || 0, color: "#3B82F6" },
      { label: "OTP Sent", count: stats.otp_sent?.count || 0, color: "#6366F1" },
      { label: "OTP Verified", count: stats.otp_verified?.count || 0, color: "#8B5CF6" },
      { label: "Dice Rolled", count: stats.dice_rolled?.count || 0, color: "#A855F7" },
    ];

    const chartData = {
      labels: funnelData.map(item => item.label),
      datasets: [
        {
          label: 'Count',
          data: funnelData.map(item => item.count),
          backgroundColor: funnelData.map(item => item.color),
          borderColor: funnelData.map(item => item.color),
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Funnel Analytics',
          font: {
            size: 18,
            weight: 'bold' as const,
          },
          padding: 20,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y;
              const total = funnelData[0].count;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#E5E7EB',
          },
          ticks: {
            font: {
              size: 12,
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
            },
          },
        },
      },
    };

    // Calculate conversion rates
    const conversionRates = [
      {
        from: "Entered",
        to: "OTP Sent", 
        rate: funnelData[0].count > 0 ? ((funnelData[1].count / funnelData[0].count) * 100).toFixed(1) : '0'
      },
      {
        from: "OTP Sent",
        to: "OTP Verified",
        rate: funnelData[1].count > 0 ? ((funnelData[2].count / funnelData[1].count) * 100).toFixed(1) : '0'
      },
      {
        from: "OTP Verified", 
        to: "Dice Rolled",
        rate: funnelData[2].count > 0 ? ((funnelData[3].count / funnelData[2].count) * 100).toFixed(1) : '0'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {funnelData.map((item) => (
            <div key={item.label} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-3"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversion Rates */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Conversion Rates</h3>
          <div className="grid grid-cols-3 gap-4">
            {conversionRates.map((conversion, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-600">{conversion.from} → {conversion.to}</p>
                <p className="text-xl font-bold text-blue-600">{conversion.rate}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div style={{ height: '400px' }}>
            <Bar data={chartData} options={options} />
          </div>
        </div>
      </div>
    );
  };

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

  // Function to export current tab data as CSV
  const exportCSV = () => {
    if (!stats) return;
    let data: any[];
    let filename = `${activeTab}.csv`;
    if (activeTab === "funnel") {
      data = Object.entries(stats).map(([stage, val]) => ({ stage, count: val.count }));
      filename = "funnel_summary.csv";
    } else {
      // only include columns visible in the table: index, name, mobile, timestamp
      data = stats[activeTab].events.map((e, idx) => ({
        "#": idx + 1,
        Name: e.name || "",
        Mobile: e.mobile,
        Timestamp: formatDate(e.timestamp),
      }));
    }
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded self-end"
          disabled={loading || !stats || (activeTab !== 'funnel' && !stats[activeTab]?.events.length)}
        >
          Export CSV
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
          {activeTab === "funnel" ? (
            renderFunnelChart()
          ) : (
            <>
              <div className="font-semibold mb-2">
                Total {TABS.find((t) => t.key === activeTab)?.label}:{" "}
                {stats[activeTab]?.count || 0}
              </div>
              {renderTable(stats[activeTab]?.events || [])}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFunnelDashboard;
