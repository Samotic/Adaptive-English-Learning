import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import Badges from "./pages/Badges";
import Calendar from "./pages/Calendar";
import MonitoringDashboard from "./pages/MonitoringDashboard";
import TrainingDataDashboard from "./pages/TrainingDataDashboard";
import Account from "./pages/Account";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AIAssistant from "./components/AIAssistant";
import NotificationList from "./components/Notifications/NotificationList";
import { initBackgroundSync } from "./utils/backgroundSync";

function readStoredUser() {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);

  // Submit answers that were saved while offline, now and whenever the connection returns
  useEffect(() => {
    if (!token) return undefined;
    return initBackgroundSync(token);
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  /** Renders the page for signed-in users with an allowed role; redirects otherwise. */
  const guard = (element, roles) => {
    if (!token) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
    return element;
  };

  const dashboardForRole = () => {
    if (user?.role === "admin") return <AdminDashboard token={token} user={user} onLogout={handleLogout} />;
    if (user?.role === "teacher") return <TeacherDashboard token={token} user={user} onLogout={handleLogout} />;
    return <Dashboard token={token} user={user} onLogout={handleLogout} />;
  };

  return (
    <BrowserRouter>
      {token && <NotificationList token={token} />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register onLogin={handleLogin} />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/dashboard" element={guard(dashboardForRole())} />
        <Route path="/ai-assistant" element={guard(<AIAssistant token={token} />)} />
        <Route path="/support" element={guard(<Support token={token} />)} />
        <Route path="/account" element={guard(<Account token={token} user={user} onLogout={handleLogout} />)} />
        <Route path="/privacy" element={guard(<Privacy token={token} />)} />
        <Route path="/badges" element={guard(<Badges token={token} user={user} />)} />
        <Route path="/calendar" element={guard(<Calendar token={token} user={user} />)} />

        <Route path="/teacher" element={guard(<TeacherDashboard token={token} user={user} onLogout={handleLogout} />, ["teacher", "admin"])} />
        <Route path="/admin" element={guard(<AdminDashboard token={token} user={user} onLogout={handleLogout} />, ["admin"])} />
        <Route path="/admin/audit-logs" element={guard(<AdminAuditLogs />, ["admin"])} />
        <Route path="/monitoring" element={guard(<MonitoringDashboard token={token} />, ["admin"])} />
        <Route path="/training-data" element={guard(<TrainingDataDashboard />, ["admin"])} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
