import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import api from "../lib/api";
import { RoleProfile } from "./RoleLibraryPanel";

type CompareItem = {
  role_id: number | null;
  role_title: string;
  score: number;
  confidence: number;
  strengths: string[];
  missing_skills_top5: string[];
  summary: string;
  analysis_payload?: any;
};

type Props = {
  roles: RoleProfile[];
  onOpenResult: (payload: any) => void;
};

export default function MultiRoleComparePanel({ roles, onOpenResult }: Props) {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [analysisMode, setAnalysisMode] = useState<"standard" | "strict">("standard");
  const [ranked, setRanked] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedRoles((prev) => prev.filter((id) => roles.some((r) => r.id === id)));
  }, [roles]);

  const compare = async () => {
    if (!resumeFile) {
      setError("Upload a resume (PDF/DOCX) to compare.");
      return;
    }
    if (!selectedRoles.length) {
      setError("Select at least one role profile.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("resume_file", resumeFile);
      form.append("role_profile_ids_json", JSON.stringify(selectedRoles));
      form.append("analysis_mode", analysisMode);
      if (candidateName.trim()) form.append("candidate_name", candidateName.trim());

      const { data } = await api.post("/match/compare-roles", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRanked(data?.ranked || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-card p-5 shadow-soft">
      <h3 className="mb-3 text-lg font-bold">Compare Against Multiple Roles</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <input className="input-field" placeholder="Candidate name (optional)" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
        <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="input-field" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
      </div>

      <div className="mt-3 flex gap-2">
        {(["standard", "strict"] as const).map((mode) => (
          <button key={mode} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${analysisMode === mode ? "bg-skyline text-white" : "border border-white/20 bg-white/10"}`} onClick={() => setAnalysisMode(mode)}>
            {mode}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {roles.map((role) => {
          const checked = selectedRoles.includes(role.id);
          return (
            <label key={role.id} className="surface flex items-start gap-2 rounded-lg p-2 text-sm">
              <input type="checkbox" checked={checked} onChange={(e) => {
                setSelectedRoles((prev) => e.target.checked ? [...prev, role.id] : prev.filter((x) => x !== role.id));
              }} />
              <span>{role.title}</span>
            </label>
          );
        })}
      </div>

      {error && <p className="mt-3 rounded-lg bg-rose-500/10 p-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}

      <button className="mt-4 rounded-lg bg-skyline px-4 py-2 text-sm font-semibold text-white" onClick={compare} disabled={loading}>
        {loading ? "Comparing..." : "Compare Roles"}
      </button>

      {!!ranked.length && (
        <div className="mt-4 space-y-2">
          {ranked.map((item) => (
            <motion.div key={`${item.role_id ?? item.role_title}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface rounded-xl p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold">{item.role_title}</p>
                <p className="font-bold">{item.score}%</p>
              </div>
              <div className="h-2 rounded bg-slate-300/30 dark:bg-slate-700/30">
                <div className="h-2 rounded bg-skyline" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{item.summary}</p>
              {!!item.analysis_payload && (
                <button
                  className="mt-2 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs"
                  onClick={() => {
                    const payload = {
                      ...item.analysis_payload,
                      input_metadata: {
                        ...(item.analysis_payload.input_metadata || {}),
                        role_title: item.role_title,
                      },
                    };
                    onOpenResult(payload);
                  }}
                >
                  Open in Result View
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}