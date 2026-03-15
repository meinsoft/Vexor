import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import Analyze from "@/pages/Analyze";
import Dashboard from "@/pages/Dashboard";
import Drill from "@/pages/Drill";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Settings from "@/pages/Settings";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-vexor-muted">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
        path="/analyze"
        element={
          <ProtectedLayout>
            <Analyze />
          </ProtectedLayout>
        }
      />
        <Route
          path="/drill"
          element={
            <ProtectedLayout>
              <Drill />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          }
        />
      </Routes>
    </Router>
  );
}
