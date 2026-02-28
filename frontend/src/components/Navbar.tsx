import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, LogOut, BriefcaseBusiness } from "lucide-react";

import { useTheme } from "../hooks/useTheme";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isAuthPage = location.pathname === "/login";
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-4">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 shadow-soft">
        <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <BriefcaseBusiness className="h-5 w-5 text-skyline" />
          TALENTALIGN AI
        </Link>
        <div className="flex items-center gap-2">
          {!isAuthPage && (
            <Link
              className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-white/10"
              to={token ? "/dashboard" : "/login"}
            >
              {token ? "Dashboard" : "Login"}
            </Link>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.04 }}
            onClick={toggleTheme}
            className="rounded-xl p-2 hover:bg-white/10"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </motion.button>
          {token && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.04 }}
              onClick={logout}
              className="rounded-xl p-2 hover:bg-white/10"
            >
              <LogOut className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </nav>
    </header>
  );
}
