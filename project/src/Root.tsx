import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminFunnelDashboard from "./components/AdminFunnelDashboard";

const Root: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Navigate to="/admin/funnel" replace />} />
      <Route path="/admin/funnel" element={<AdminFunnelDashboard />} />
      <Route path="*" element={<Navigate to="/admin/funnel" replace />} />
    </Routes>
  </Router>
);

export default Root;
