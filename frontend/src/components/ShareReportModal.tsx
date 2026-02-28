import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import api from "../lib/api";

type Props = {
  analysisId?: number;
};

export default function ShareReportModal({ analysisId }: Props) {
  const [open, setOpen] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");

  const create = async () => {
    if (!analysisId) {
      setError("Missing analysis id. Run analysis again and retry.");
      return;
    }
    try {
      const { data } = await api.post("/share/create", { analysis_id: analysisId, expires_in_days: expiresInDays });
      const absolute = `${window.location.origin}${data.share_url}`;
      setShareUrl(absolute);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create share link.");
    }
  };

  return (
    <>
      <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>
        Share Report
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div className="glass w-full max-w-xl rounded-2xl p-5" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(e) => e.stopPropagation()}>
              <h4 className="mb-2 text-lg font-bold">Create Share Link</h4>
              <label className="mb-2 block text-sm">Expiry (days)</label>
              <input className="input-field mb-3" type="number" min={1} max={30} value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value || 7))} />
              <button className="rounded-lg bg-skyline px-3 py-2 text-sm font-semibold text-white" onClick={create}>Generate Link</button>
              {error && <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
              {!!shareUrl && (
                <div className="mt-3 rounded-lg border border-white/20 bg-white/10 p-3">
                  <p className="break-all text-sm">{shareUrl}</p>
                  <button className="mt-2 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy Link</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}