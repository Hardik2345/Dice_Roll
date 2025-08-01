import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminFunnelDashboard from "./components/AdminFunnelDashboard";
import AdminLogin from "./components/AdminLogin";
import RequireAuth from "./components/RequireAuth";

const Root: React.FC = () => (
  <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/funnel" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/funnel"
          element={
            <RequireAuth>
              <AdminFunnelDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/admin/funnel" replace />} />
      </Routes>
  </Router>
);

export default Root;
