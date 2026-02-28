import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Result from "./pages/Result";
import SharedReport from "./pages/SharedReport";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shared/:token" element={<SharedReport />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <Result />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
