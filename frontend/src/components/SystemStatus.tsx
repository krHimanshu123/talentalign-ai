import { useEffect, useState } from "react";

import api from "../lib/api";

export default function SystemStatus() {
  const [status, setStatus] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await api.get("/api/health");
        if (mounted) setStatus("ok");
      } catch {
        if (mounted) setStatus("down");
      }
    };
    check();
    const timer = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const tone = status === "ok" ? "bg-emerald-500" : status === "down" ? "bg-rose-500" : "bg-amber-500";
  const label = status === "ok" ? "System healthy" : status === "down" ? "Backend unreachable" : "Checking...";

  return (
    <div className="mt-6 flex items-center justify-end gap-2 text-xs text-[var(--text-muted)]">
      <span className={`h-2.5 w-2.5 rounded-full ${tone}`} /> {label}
    </div>
  );
}