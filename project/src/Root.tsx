import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
// import AdminDashboard from "./components/AdminDashboard";
import AdminFunnelDashboard from "./components/AdminFunnelDashboard";

const Root: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}
      <Route path="/admin/funnel" element={<AdminFunnelDashboard />} />
    </Routes>
  </Router>
);

export default Root;
