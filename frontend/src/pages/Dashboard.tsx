import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import {
  ClipboardPenLine,
  History,
  Sparkles,
  FileText,
  BriefcaseBusiness,
  Clock3,
  CheckCircle2,
  Library,
  GitCompareArrows,
} from "lucide-react";

import MultiRoleComparePanel from "../components/MultiRoleComparePanel";
import RoleLibraryPanel, { RoleProfile } from "../components/RoleLibraryPanel";
import SystemStatus from "../components/SystemStatus";
import UploadCard from "../components/UploadCard";
import api from "../lib/api";

type Tab = "input" | "history" | "roles" | "compare";

type HistoryItem = {
  id: string;
  score: number;
  created_at: string;
  candidate_name?: string | null;
  role_title?: string | null;
  overlapping_skills: string[];
  missing_skills: string[];
  result: any;
};

const HISTORY_KEY = "analysis_history";
const JD_TEMPLATES = [
  {
    label: "Full-Stack Engineer",
    text: "We are hiring a Full-Stack Engineer with React, TypeScript, Node.js, REST APIs, SQL, Docker, and AWS experience. Candidates should deliver scalable features, write tests, and collaborate in Agile teams.",
  },
  {
    label: "Data Scientist",
    text: "Looking for a Data Scientist skilled in Python, Pandas, NumPy, scikit-learn, NLP, model evaluation, and experiment design. Experience with SQL and cloud platforms is preferred.",
  },
  {
    label: "ML Engineer",
    text: "Seeking an ML Engineer with experience in PyTorch/TensorFlow, MLOps, model deployment, CI/CD, containerization, and monitoring model performance in production systems.",
  },
];

export default function Dashboard() {
  const [resume, setResume] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [analysisMode, setAnalysisMode] = useState<"standard" | "strict">("standard");
  const [candidateName, setCandidateName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");

  const [tab, setTab] = useState<Tab>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const shellRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const history = useMemo<HistoryItem[]>(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  }, [tab, historyVersion]);

  useEffect(() => {
    if (!shellRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dash-reveal",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" }
      );
    }, shellRef);
    return () => ctx.revert();
  }, [tab]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data } = await api.get("/roles");
        setRoles(data || []);
      } catch {
        // Keep dashboard usable even if roles are unavailable.
      }
    };
    loadRoles();
  }, []);

  const analyze = async () => {
    if (!resume) {
      setError("Please upload a resume file (PDF or DOCX).");
      return;
    }
    if (!jdText && !jdFile) {
      setError("Provide JD text or upload JD file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume_file", resume);
      if (jdText.trim()) formData.append("jd_text", jdText.trim());
      if (jdFile) formData.append("jd_file", jdFile);
      formData.append("analysis_mode", analysisMode);
      if (candidateName.trim()) formData.append("candidate_name", candidateName.trim());
      if (roleTitle.trim()) formData.append("role_title", roleTitle.trim());

      const { data } = await api.post("/match/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("analysis_result", JSON.stringify(data));

      const existing: HistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const nextItem: HistoryItem = {
        id: crypto.randomUUID(),
        score: data.score,
        created_at: new Date().toISOString(),
        candidate_name: data.input_metadata?.candidate_name ?? (candidateName.trim() || null),
        role_title: data.input_metadata?.role_title ?? (roleTitle.trim() || null),
        overlapping_skills: data.overlapping_skills || [],
        missing_skills: data.missing_skills || [],
        result: data,
      };
      localStorage.setItem(HISTORY_KEY, JSON.stringify([nextItem, ...existing].slice(0, 10)));
      setHistoryVersion((v) => v + 1);

      navigate("/result");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (text: string) => {
    setJdText(text);
    setTab("input");
  };

  return (
    <motion.main
      ref={shellRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl px-4 pb-16 pt-8"
    >
      <section className="dash-reveal glass mb-5 rounded-[1.4rem] p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-skyline">Recruiter Workspace</p>
            <h1 className="mt-1 text-2xl font-extrabold">Talent Match Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-skyline" /> AI semantic analysis enabled
          </div>
        </div>
      </section>

      <div className="dash-reveal mb-4 grid gap-3 md:grid-cols-3">
        {[
          ["Embeddings", "Contextual similarity scoring"],
          ["Skill Engine", "Overlap + gap intelligence"],
          ["Insight AI", "Actionable resume upgrades"],
        ].map(([title, text]) => (
          <div key={title} className="surface rounded-2xl p-3">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-[var(--text-muted)]">{text}</p>
          </div>
        ))}
      </div>

      <div className="dash-reveal mb-6 flex flex-wrap gap-2">
        {([
          ["input", "New Analysis", ClipboardPenLine],
          ["history", "Recent Snapshot", History],
          ["roles", "Role Library", Library],
          ["compare", "Compare Roles", GitCompareArrows],
        ] as [Tab, string, any][]).map(([item, label, Icon]) => (
          <motion.button
            key={item}
            onClick={() => setTab(item)}
            className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === item ? "text-white" : "glass"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {tab === item && (
              <motion.span
                layoutId="tab-bg"
                className="absolute inset-0 rounded-xl bg-skyline"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              <Icon className="h-4 w-4" /> {label}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "input" ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <UploadCard
              title="Upload Resume"
              subtitle="Upload candidate resume in PDF or DOCX format."
              onChange={setResume}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <UploadCard
              title="Upload Job Description"
              subtitle="Optional if JD text is entered below. PDF or DOCX supported."
              onChange={setJdFile}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />

            <motion.div whileHover={{ y: -3 }} className="glass rounded-card p-5 shadow-soft md:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5 text-skyline" />
                <h3 className="text-lg font-bold">Paste Job Description</h3>
              </div>
              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <input
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Candidate name (optional)"
                  className="input-field"
                />
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Target role title (optional)"
                  className="input-field"
                />
              </div>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here..."
                className="input-field"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {JD_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => applyTemplate(tpl.text)}
                    className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/15"
                  >
                    Use {tpl.label} Template
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-semibold">Analysis Mode:</span>
                <button
                  type="button"
                  onClick={() => setAnalysisMode("standard")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    analysisMode === "standard" ? "bg-skyline text-white" : "border border-white/20 bg-white/10"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisMode("strict")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    analysisMode === "strict" ? "bg-skyline text-white" : "border border-white/20 bg-white/10"
                  }`}
                >
                  Strict
                </button>
              </div>
              {error && (
                <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-2 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                onClick={analyze}
                disabled={loading}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-skyline px-5 py-3 font-semibold text-white"
              >
                <FileText className="h-4 w-4" /> {loading ? "Analyzing..." : "Analyze Match"}
              </motion.button>
            </motion.div>
          </motion.div>
        ) : tab === "history" ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {!!history.length && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(HISTORY_KEY);
                    setHistoryVersion((v) => v + 1);
                  }}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                >
                  Clear History
                </button>
              </div>
            )}
            {history.length ? (
              history.map((item, index) => (
                <div key={item.id || `${item.created_at}-${index}`} className="glass rounded-2xl p-4 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Clock3 className="h-4 w-4" /> {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 px-2 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" /> {item.score}% match
                    </div>
                  </div>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Candidate:</span> {item.candidate_name || "-"} |{" "}
                    <span className="font-semibold">Role:</span> {item.role_title || "-"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Overlap: {item.overlapping_skills.slice(0, 5).join(", ") || "-"}
                  </p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                    onClick={() => {
                      localStorage.setItem("analysis_result", JSON.stringify(item.result));
                      navigate("/result");
                    }}
                  >
                    Open Result
                  </button>
                </div>
              ))
            ) : (
              <div className="glass rounded-card p-5 shadow-soft">
                <h3 className="mb-3 text-lg font-bold">No history yet</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Complete your first analysis and snapshots will appear here.
                </p>
              </div>
            )}
          </motion.div>
        ) : tab === "roles" ? (
          <motion.div key="roles" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <RoleLibraryPanel
              currentJdText={jdText}
              onRolesChanged={(next) => setRoles(next)}
              onSelectRole={(role) => {
                setRoleTitle(role.title);
                setJdText(role.jd_text);
                setTab("input");
              }}
            />
          </motion.div>
        ) : (
          <motion.div key="compare" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <MultiRoleComparePanel
              roles={roles}
              onOpenResult={(payload) => {
                localStorage.setItem("analysis_result", JSON.stringify(payload));
                navigate("/result");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SystemStatus />
    </motion.main>
  );
}
