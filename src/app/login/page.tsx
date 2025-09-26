"use client";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://229c09b5763a.ngrok-free.app";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showChange, setShowChange] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  async function handleChangePassword() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error("Failed to change password");
      alert("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Login</h1>

        <form onSubmit={onSubmit} className="form">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn primary">
            Login
          </button>
        </form>

        <div className="divider">
          <button onClick={() => setShowChange((s) => !s)} className="link">
            {showChange ? "Cancel" : "Change Password"}
          </button>
        </div>

        {showChange && (
          <div className="change-section">
            <input
              placeholder="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
            />
            <input
              placeholder="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
            <button onClick={handleChangePassword} className="btn success">
              Submit
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f5f6fa;
          padding: 1rem;
        }
        .card {
          background: #fff;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          width: 100%;
          max-width: 400px;
        }
        .title {
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1.5rem;
          color: #333;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 0.95rem;
          outline: none;
          transition: border 0.2s ease;
        }
        .input:focus {
          border-color: #0070f3;
        }
        .btn {
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .btn.primary {
          background: #0070f3;
          color: white;
        }
        .btn.primary:hover {
          background: #005bb5;
        }
        .btn.success {
          background: #28a745;
          color: white;
        }
        .btn.success:hover {
          background: #1f7c33;
        }
        .error {
          color: #d9534f;
          font-size: 0.9rem;
        }
        .divider {
          text-align: center;
          margin: 1rem 0;
        }
        .link {
          background: none;
          border: none;
          color: #0070f3;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
        }
        .change-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        /* Mobile friendly */
        @media (max-width: 480px) {
          .card {
            padding: 1.5rem;
          }
          .title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
