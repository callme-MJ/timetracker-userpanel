"use client";
import { useEffect, useState } from "react";
import {
  Clock,
  Calendar,
  Coffee,
  Play,
  Square,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import "./Home.css";

const API_BASE = "https://unsumptuous-meekly-charles.ngrok-free.dev";

async function api(path: string, options?: RequestInit) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options?.headers || {}),
    },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    return null as any;
  }
  return res.json();
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [workdays, setWorkdays] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

  function addToast(message: string, type: 'success' | 'error' = 'success', timeoutMs = 3000) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, timeoutMs);
  }

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      const data = await api(`/time/me?${qs.toString()}`);
      setWorkdays(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e: any) {
      setError(e.message);
      // addToast(e.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      try {
        const me = await api(`/auth/me`);
        setCurrentUser(me);
      } catch (err: any) {
        // addToast(err?.message || 'Failed to load profile', 'error');
      }
      await load();
    })();
  }, [page, limit, from, to]);

  async function call(path: string) {
    try {
      const res = await api(path, { method: "POST" });
      console.log(res);
      
      if (res.error) {
        addToast(res.message, 'error');
        
      }else{
        addToast("Action Success", "success")
      }
      await load();
      return res;
    } catch (e: any) {
      console.log(error);
      
      // addToast(e?.message || 'Action failed', 'error');
    }
  }

  const formatDuration = (ms: number) => {
    if (!ms) return "-";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTodaysEntry = () => {
    const today = new Date().toISOString().split("T")[0];
    return workdays.find((wd) => wd.date === today);
  };

  const todaysEntry = getTodaysEntry();
  const isWorkingToday = todaysEntry?.startTime && !todaysEntry?.endTime;
  const onBreakToday = todaysEntry?.breaks?.some((b: any) => b.start && !b.end);

  return (
    <div className="time-tracker">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <Clock className="icon" />
          </div>
          <div>
            <h1>Time Tracker</h1>
            <p>{currentTime.toLocaleDateString()}</p>
          </div>
        </div>
        <div className="header-middle">
          {currentUser && (
            <span className="welcome" style={{ marginRight: 12 }}>
              Welcome, {currentUser.name || currentUser.email}
            </span>
          )}
        </div>
        <div className="header-right">
          <span className="clock">{currentTime.toLocaleTimeString()}</span>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            <LogOut className="icon" /> Logout
          </button>
        </div>
      </header>

      <main className="main">
        {/* Current Status */}
        <section className="card">
          <div className="card-header">
            <h2>Current Status</h2>
            <span className="time-label">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
          <div className="status-buttons">
            <button
              onClick={() => call("/time/start")}
              disabled={isWorkingToday}
              className={`btn ${isWorkingToday ? "btn-disabled" : "btn-green"}`}
            >
              <Play className="icon" />{" "}
              {isWorkingToday ? "Day Started" : "Start Day"}
            </button>
            <button
              onClick={() => call("/time/break/start")}
              disabled={!isWorkingToday || onBreakToday}
              className={`btn ${onBreakToday
                ? "btn-disabled"
                : isWorkingToday
                  ? "btn-yellow"
                  : "btn-gray"
                }`}
            >
              <Coffee className="icon" />{" "}
              {onBreakToday ? "On Break" : "Start Break"}
            </button>
            <button
              onClick={() => call("/time/break/end")}
              disabled={!onBreakToday}
              className={`btn ${onBreakToday ? "btn-blue" : "btn-gray"}`}
            >
              <Play className="icon" /> End Break
            </button>
            <button
              onClick={() => call("/time/end")}
              disabled={!isWorkingToday}
              className={`btn ${isWorkingToday ? "btn-red" : "btn-gray"}`}
            >
              <Square className="icon" /> End Day
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="card">
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="icon" /> Filters & Settings
            <ChevronRight
              className={`chevron ${showFilters ? "rotated" : ""}`}
            />
          </button>
          {showFilters && (
            <div className="filters">
              <div className="filter">
                <label>From Date</label>
                <input
                  type="date"
                  value={from || ""}
                  onChange={(e) => setFrom(e.target.value || undefined)}
                />
              </div>
              <div className="filter">
                <label>To Date</label>
                <input
                  type="date"
                  value={to || ""}
                  onChange={(e) => setTo(e.target.value || undefined)}
                />
              </div>
              <div className="filter">
                <label>Per Page</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                >
                  <option value={10}>10 entries</option>
                  <option value={20}>20 entries</option>
                  <option value={50}>50 entries</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Workdays Table */}
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <section className="card">
            <table className="workdays-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Work Time</th>
                  <th>Break Time</th>
                  <th>Breaks</th>
                </tr>
              </thead>
              <tbody>
                {workdays.map((wd) => (
                  <tr key={wd._id}>
                    <td data-label="Date">{new Date(wd.date).toLocaleDateString()}</td>
                    <td data-label="Start">{wd.startTime ? formatTime(wd.startTime) : "-"}</td>
                    <td data-label="End">{wd.endTime ? formatTime(wd.endTime) : "-"}</td>
                    <td data-label="Work Time">{formatDuration(wd.totalWorkTime)}</td>
                    <td data-label="Break Time">{formatDuration(wd.totalBreakTime)}</td>
                    <td data-label="Breaks">
                      {(wd.breaks || []).map((b: any, i: number) => (
                        <span key={i} className="break-label">
                          {formatTime(b.start)} - {b.end ? formatTime(b.end) : "..."}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="icon" /> Previous
              </button>
              <span>
                Page {page} of {Math.max(1, Math.ceil(total / limit))} (
                {total} total)
              </span>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="icon" />
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Toasts */}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
