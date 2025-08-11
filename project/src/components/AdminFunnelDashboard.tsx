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

// Core event types we display as tabs (exclude discount_used for now)
const EVENT_TYPES = ["entered", "otp_sent", "otp_verified", "dice_rolled"] as const;

type EventType = typeof EVENT_TYPES[number];

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
    headers.map(h => `"${(item as any)[h] ?? ""}"`).join(",")
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
  discountCode?: string;
  unhashedMobile?: string | null;
}

interface PaginatedEventsResponse {
  eventType: string;
  count: number;
  page: number;
  totalPages: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  events: FunnelEvent[];
}

interface EventPageMeta {
  events: FunnelEvent[];
  count: number;
  page: number;
  totalPages: number;
  limit: number;
}

const AdminFunnelDashboard: React.FC = () => {
  // Date filters
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Tab + search
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);
  const [mobileSearch, setMobileSearch] = useState<string>("");
  const [debouncedMobileSearch, setDebouncedMobileSearch] = useState<string>("");

  // Counts per event type (for funnel + summary cards)
  const [counts, setCounts] = useState<Record<EventType, number>>({
    entered: 0,
    otp_sent: 0,
    otp_verified: 0,
    dice_rolled: 0,
  });

  // Cached pages per event type
  const [pages, setPages] = useState<Record<EventType, EventPageMeta | undefined>>({
    entered: undefined,
    otp_sent: undefined,
    otp_verified: undefined,
    dice_rolled: undefined,
  });

  // Pagination settings
  const [pageSize, setPageSize] = useState<number>(50);
  const [pageByEvent, setPageByEvent] = useState<Record<EventType, number>>({
    entered: 1,
    otp_sent: 1,
    otp_verified: 1,
    dice_rolled: 1,
  });

  // Loading & errors
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string>("");

  // Debounce mobile search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMobileSearch(mobileSearch.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [mobileSearch]);

  // Helper: common query params
  const baseParams = useCallback(() => ({
    startDate,
    endDate,
    mobile: debouncedMobileSearch || undefined,
  }), [startDate, endDate, debouncedMobileSearch]);

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      // Parallel requests limit=1 just to read total count
      const promises = EVENT_TYPES.map(et => axios.get<PaginatedEventsResponse>(`${API_BASE}/api/admin/funnel-stats`, {
        withCredentials: true,
        params: { ...baseParams(), eventType: et, page: 1, limit: 1, t: Date.now() }
      }));
      const results = await Promise.all(promises);
      const newCounts: Record<EventType, number> = { ...counts };
      results.forEach(r => {
        const et = r.data.eventType as EventType;
        if (EVENT_TYPES.includes(et)) {
          newCounts[et] = r.data.count;
        }
      });
      setCounts(newCounts);
    } catch (e) {
      setError((e as any)?.response?.data?.error || 'Failed to fetch counts');
    } finally {
      setLoadingCounts(false);
    }
  }, [baseParams, counts]);

  const fetchPage = useCallback(async (eventType: EventType, page: number, overridePageSize?: number) => {
    setLoadingEvents(true);
    try {
      const res = await axios.get<PaginatedEventsResponse>(`${API_BASE}/api/admin/funnel-stats`, {
        withCredentials: true,
        params: { ...baseParams(), eventType, page, limit: overridePageSize ?? pageSize, t: Date.now() }
      });
      const data = res.data;
      setPages(prev => ({
        ...prev,
        [eventType]: {
          events: data.events,
            count: data.count,
            page: data.page,
            totalPages: data.totalPages,
            limit: data.limit
        }
      }));
      // Update count in case changed
      setCounts(prev => ({ ...prev, [eventType]: data.count }));
      setPageByEvent(prev => ({ ...prev, [eventType]: data.page }));
    } catch (e) {
      setError((e as any)?.response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoadingEvents(false);
    }
  }, [baseParams, pageSize]);

  // Initial + filter changes: refresh counts + current tab page (if not funnel)
  useEffect(() => {
    setError("");
    fetchCounts();
    if (activeTab !== 'funnel') {
      const et = activeTab as EventType;
      fetchPage(et, 1); // reset to first page on filter change
      setPageByEvent(prev => ({ ...prev, [et]: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, debouncedMobileSearch]);

  // On tab switch: fetch if no cache OR cached limit mismatches current global pageSize
  useEffect(() => {
    if (activeTab !== 'funnel') {
      const et = activeTab as EventType;
      const meta = pages[et];
      if (!meta || meta.limit !== pageSize) {
        // Always reset to page 1 when limit changes for consistency
        setPageByEvent(prev => ({ ...prev, [et]: 1 }));
        fetchPage(et, 1);
      }
    }
  }, [activeTab, fetchPage, pages, pageSize]);

  // Socket updates: refresh counts & current page
  useEffect(() => {
    const socket: Socket = io(API_BASE, { transports: ['websocket'], withCredentials: true });
    socket.on('funnelEventUpdate', () => {
      fetchCounts();
      if (activeTab !== 'funnel') {
        const et = activeTab as EventType;
        fetchPage(et, pageByEvent[et]);
      }
    });
    return () => { socket.disconnect(); };
  }, [fetchCounts, fetchPage, activeTab, pageByEvent]);

  // Pagination handlers
  const goToPage = (eventType: EventType, target: number) => {
    const meta = pages[eventType];
    if (!meta) return;
    if (target < 1 || target > meta.totalPages) return;
    fetchPage(eventType, target);
  };

  const changePageSize = (newSize: number) => {
    if (newSize === pageSize) return; // no change
    // Update global size first
    setPageSize(newSize);
    // Invalidate all cached pages so each tab will lazy-reload with new size
    setPages({
      entered: undefined,
      otp_sent: undefined,
      otp_verified: undefined,
      dice_rolled: undefined,
    });
    // Reset all page indices to 1 (simplest consistency model)
    setPageByEvent({
      entered: 1,
      otp_sent: 1,
      otp_verified: 1,
      dice_rolled: 1,
    });
    // Immediately refetch only the active tab (others lazy on first view)
    if (activeTab !== 'funnel') {
      const et = activeTab as EventType;
      fetchPage(et, 1, newSize); // override to avoid stale closure
    }
  };

  // Funnel chart uses counts
  const renderFunnelChart = () => {
    const funnelData = [
      { label: 'Entered', count: counts.entered, color: '#3B82F6' },
      { label: 'OTP Sent', count: counts.otp_sent, color: '#6366F1' },
      { label: 'OTP Verified', count: counts.otp_verified, color: '#8B5CF6' },
      { label: 'Dice Rolled', count: counts.dice_rolled, color: '#A855F7' },
    ];

    const chartData = {
      labels: funnelData.map(i => i.label),
      datasets: [{
        label: 'Count',
        data: funnelData.map(i => i.count),
        backgroundColor: funnelData.map(i => i.color),
        borderColor: funnelData.map(i => i.color),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Funnel Analytics', font: { size: 18, weight: 'bold' as const }, padding: 20 },
        tooltip: { callbacks: { label: (ctx: any) => {
          const value = ctx.parsed.y;
          const total = funnelData[0].count;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          return `${ctx.label}: ${value} (${percentage}%)`;
        } } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#E5E7EB' }, ticks: { font: { size: 12 } } },
        x: { grid: { display: false }, ticks: { font: { size: 12 } } }
      }
    };

    const conversionRates = [
      { from: 'Entered', to: 'OTP Sent', rate: counts.entered > 0 ? ((counts.otp_sent / counts.entered) * 100).toFixed(1) : '0' },
      { from: 'OTP Sent', to: 'OTP Verified', rate: counts.otp_sent > 0 ? ((counts.otp_verified / counts.otp_sent) * 100).toFixed(1) : '0' },
      { from: 'OTP Verified', to: 'Dice Rolled', rate: counts.otp_verified > 0 ? ((counts.dice_rolled / counts.otp_verified) * 100).toFixed(1) : '0' },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {funnelData.map(item => (
            <div key={item.label} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded mr-3" style={{ backgroundColor: item.color }}></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Conversion Rates</h3>
          <div className="grid grid-cols-3 gap-4">
            {conversionRates.map((c, i) => (
              <div key={i} className="text-center">
                <p className="text-sm text-gray-600">{c.from} → {c.to}</p>
                <p className="text-xl font-bold text-blue-600">{c.rate}%</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div style={{ height: '400px' }}>
            <Bar data={chartData} options={options} />
          </div>
        </div>
      </div>
    );
  };

  const renderTable = (meta: EventPageMeta) => (
    <>
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
          {meta.events.map((e, i) => (
            <tr key={e._id}>
              <td className="border px-2 py-1">{(meta.page - 1) * meta.limit + i + 1}</td>
              <td className="border px-2 py-1">{e.name || '-'}</td>
              <td className="border px-2 py-1">{e.mobile}</td>
              <td className="border px-2 py-1">{formatDate(e.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={meta.page <= 1 || loadingEvents}
            onClick={() => goToPage(activeTab as EventType, meta.page - 1)}
          >Prev</button>
          <span className="text-sm">Page {meta.page} of {meta.totalPages}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={meta.page >= meta.totalPages || loadingEvents}
            onClick={() => goToPage(activeTab as EventType, meta.page + 1)}
          >Next</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Rows per page:</label>
          <select
            className="border rounded px-2 py-1"
            value={pageSize}
            disabled={loadingEvents}
            onChange={e => changePageSize(parseInt(e.target.value, 10))}
          >
            {[10,25,50,100,200].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <span className="text-xs text-gray-600">Total: {meta.count}</span>
        </div>
      </div>
    </>
  );

  // CSV export: funnel summary or current tab page
  const exportCSV = () => {
    if (activeTab === 'funnel') {
      const data = [
        { Stage: 'Entered', Count: counts.entered },
        { Stage: 'OTP Sent', Count: counts.otp_sent },
        { Stage: 'OTP Verified', Count: counts.otp_verified },
        { Stage: 'Dice Rolled', Count: counts.dice_rolled },
      ];
      const csv = toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'funnel_summary.csv'; a.click();
      URL.revokeObjectURL(url);
    } else {
      const meta = pages[activeTab as EventType];
      if (!meta || !meta.events.length) return;
      const data = meta.events.map((e, idx) => ({
        '#': (meta.page - 1) * meta.limit + idx + 1,
        Name: e.name || '',
        Mobile: e.mobile,
        Timestamp: formatDate(e.timestamp)
      }));
      const csv = toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${activeTab}_page${meta.page}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const currentMeta = activeTab !== 'funnel' ? pages[activeTab as EventType] : undefined;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-30 -mx-6 px-6 pt-4 pb-4 mb-4 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Admin Funnel Dashboard</h1>
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div>
            <label className="block text-sm">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" max={endDate} />
          </div>
          <div>
            <label className="block text-sm">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" min={startDate} max={new Date().toISOString().slice(0,10)} />
          </div>
          <div>
            <label className="block text-sm">Search Mobile</label>
              <input type="text" value={mobileSearch} onChange={e => setMobileSearch(e.target.value)} placeholder="Enter mobile number" className="border rounded px-2 py-1" />
          </div>
          <button
            onClick={() => { fetchCounts(); if (activeTab !== 'funnel') fetchPage(activeTab as EventType, pageByEvent[activeTab as EventType]); }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loadingCounts || loadingEvents}
          >{(loadingCounts || loadingEvents) ? 'Loading...' : 'Refresh'}</button>
          <button
            onClick={exportCSV}
            className={`bg-green-600 text-white px-4 py-2 rounded ${ (activeTab === 'funnel' ? false : !currentMeta?.events.length) || loadingCounts || loadingEvents ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
            disabled={(activeTab === 'funnel' ? false : !currentMeta?.events.length) || loadingCounts || loadingEvents}
          >Export CSV</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-t ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveTab(tab.key)}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {activeTab === 'funnel' ? (
        loadingCounts ? <div>Loading funnel...</div> : renderFunnelChart()
      ) : (
        <div>
          <div className="font-semibold mb-2">Total {TABS.find(t => t.key === activeTab)?.label}: {counts[activeTab as EventType] || 0}</div>
          {loadingEvents && !currentMeta ? <div>Loading events...</div> : currentMeta ? renderTable(currentMeta) : <div>No data</div>}
        </div>
      )}
    </div>
  );
};

export default AdminFunnelDashboard;
