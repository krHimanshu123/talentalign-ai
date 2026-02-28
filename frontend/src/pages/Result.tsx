import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Download, RotateCcw, TrendingUp } from "lucide-react";

import Heatmap from "../components/Heatmap";
import InterviewKitPanel from "../components/InterviewKitPanel";
import ShareReportModal from "../components/ShareReportModal";
import InsightPanel from "../components/InsightPanel";
import ScoreMeter from "../components/ScoreMeter";
import SkillGapList from "../components/SkillGapList";

type TopSection = {
  resume_index: number;
  jd_index: number;
  value: number;
  resume_chunk?: string;
  jd_chunk?: string;
};

function scoreLevel(score: number) {
  if (score >= 85) return { label: "Excellent Fit", tone: "text-emerald-700 dark:text-emerald-300", note: "Candidate profile strongly aligns with role requirements." };
  if (score >= 70) return { label: "Good Fit", tone: "text-sky-700 dark:text-sky-300", note: "Strong baseline fit with targeted optimization opportunities." };
  if (score >= 55) return { label: "Moderate Fit", tone: "text-amber-700 dark:text-amber-300", note: "Partial alignment; role-specific edits recommended before submission." };
  return { label: "Low Fit", tone: "text-rose-700 dark:text-rose-300", note: "Significant gaps detected across core responsibilities or skills." };
}

function decisionFromScore(score: number, confidence: number) {
  if (score >= 80 && confidence >= 0.8) return { label: "Proceed", tone: "text-emerald-700 dark:text-emerald-300" };
  if (score >= 65) return { label: "Needs Review", tone: "text-amber-700 dark:text-amber-300" };
  return { label: "Hold", tone: "text-rose-700 dark:text-rose-300" };
}

export default function Result() {
  const sceneRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const result = useMemo(() => {
    const raw = localStorage.getItem("analysis_result");
    return raw ? JSON.parse(raw) : null;
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !result) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".result-reveal",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" }
      );
    }, sceneRef);
    return () => ctx.revert();
  }, [result]);

  if (!result) {
    return (
      <main className="mx-auto max-w-4xl px-4 pt-16">
        <div className="glass rounded-card p-6 shadow-soft">
          <h2 className="text-2xl font-bold">No analysis found</h2>
          <p className="mt-2 text-[var(--text-muted)]">Run a new analysis from the dashboard.</p>
        </div>
      </main>
    );
  }

  const level = scoreLevel(result.score || 0);
  const decision = decisionFromScore(result.score || 0, result.confidence || 0.7);

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talentalign-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySuggestions = async () => {
    const items = result?.suggestions || [];
    if (!items.length) return;
    const content = items.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
    await navigator.clipboard.writeText(content);
  };

  const copyRecruiterSummary = async () => {
    const candidate = result.input_metadata?.candidate_name || "Candidate";
    const role = result.input_metadata?.role_title || "target role";
    const summary = [
      `${candidate} evaluated for ${role}.`,
      `Final Match Score: ${result.score}% (${result.analysis_mode || "standard"} mode).`,
      `Decision: ${decision.label}.`,
      `Top strengths: ${(result.overlapping_skills || []).slice(0, 6).join(", ") || "Not enough data"}.`,
      `Primary gaps: ${(result.missing_skills || []).slice(0, 6).join(", ") || "No major gaps identified"}.`,
    ].join(" ");
    await navigator.clipboard.writeText(summary);
  };

  return (
    <motion.main
      ref={sceneRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl space-y-4 px-4 pb-16 pt-8"
    >
      <section className="result-reveal glass rounded-[1.4rem] p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-skyline">Analysis Report</p>
            <h1 className="mt-1 text-2xl font-extrabold">Candidate Match Intelligence</h1>
            <p className={`mt-1 text-sm ${level.tone}`}>
              {level.label}: {level.note}
            </p>
          </div>
          <div className="flex gap-2">
            <ShareReportModal analysisId={result.analysis_id} />
            <button
              onClick={copyRecruiterSummary}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm font-semibold shadow-sm dark:border-white/20 dark:bg-white/10"
            >
              Copy Recruiter Summary
            </button>
            <button
              onClick={copySuggestions}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm font-semibold shadow-sm dark:border-white/20 dark:bg-white/10"
            >
              Copy Suggestions
            </button>
            <button
              onClick={exportReport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm font-semibold shadow-sm dark:border-white/20 dark:bg-white/10"
            >
              <Download className="h-4 w-4" /> Export Report
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-sm font-semibold shadow-sm dark:border-white/20 dark:bg-white/10"
            >
              Print
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-skyline px-3 py-2 text-sm font-semibold text-white"
            >
              <RotateCcw className="h-4 w-4" /> New Analysis
            </button>
          </div>
        </div>
      </section>

      <div className="result-reveal grid gap-4 md:grid-cols-3">
        <div className="surface rounded-2xl p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Overall Score</p>
          <p className="text-2xl font-extrabold">{result.score}%</p>
        </div>
        <div className="surface rounded-2xl p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Overlapping Skills</p>
          <p className="text-2xl font-extrabold">{result.overlapping_skills?.length || 0}</p>
        </div>
        <div className="surface rounded-2xl p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Missing Skills</p>
          <p className="text-2xl font-extrabold">{result.missing_skills?.length || 0}</p>
        </div>
      </div>

      <div className="result-reveal glass rounded-card p-4 shadow-soft">
        <p className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Hiring Decision</p>
        <p className={`mt-1 text-2xl font-extrabold ${decision.tone}`}>{decision.label}</p>
      </div>

      <div className="result-reveal glass rounded-card p-4 shadow-soft">
        <h3 className="mb-2 text-lg font-bold">Analysis Details</h3>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            Mode: <span className="font-semibold">{result.analysis_mode || "standard"}</span>
          </p>
          <p>
            Resume File: <span className="font-semibold">{result.input_metadata?.resume_filename || "-"}</span>
          </p>
          <p>
            JD File: <span className="font-semibold">{result.input_metadata?.jd_filename || "Pasted text"}</span>
          </p>
          <p>
            Resume Characters: <span className="font-semibold">{result.input_metadata?.resume_chars ?? "-"}</span>
          </p>
          <p>
            Confidence: <span className="font-semibold">{result.confidence ? `${Math.round(result.confidence * 100)}%` : "-"}</span>
          </p>
          <p>
            Semantic Score: <span className="font-semibold">{result.input_metadata?.semantic_similarity ?? "-"}%</span>
          </p>
          <p>
            Skill Coverage: <span className="font-semibold">{result.input_metadata?.skill_coverage ?? "-"}%</span>
          </p>
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{result.score_explanation || ""}</p>
        {!!result.reliability_notes?.length && (
          <ul className="mt-3 space-y-1 text-sm text-amber-700 dark:text-amber-300">
            {result.reliability_notes.map((note: string) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="result-reveal grid gap-4 lg:grid-cols-[340px,1fr]">
        <ScoreMeter score={result.score} />
        <InsightPanel strengths={result.strengths} suggestions={result.suggestions} />
      </div>

      <div className="result-reveal">
        <InterviewKitPanel analysisId={result.analysis_id} rawAnalysis={result} />
      </div>

      <div className="result-reveal">
        <SkillGapList overlap={result.overlapping_skills} missing={result.missing_skills} />
      </div>

      <div className="result-reveal glass rounded-card p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold">Keyword Density Comparison</h3>
          <span className="inline-flex items-center gap-1 rounded-xl bg-skyline/10 px-2 py-1 text-xs font-semibold text-skyline">
            <TrendingUp className="h-3.5 w-3.5" /> Top 12 keywords
          </span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(result.keyword_density || []).slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="keyword" interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="resume_density" fill="#1074FE" name="Resume" radius={[6, 6, 0, 0]} />
              <Bar dataKey="jd_density" fill="#39D98A" name="Job Description" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="result-reveal glass rounded-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-lg font-bold">
          <ArrowUpRight className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /> Top Matching Sections
        </div>
        <div className="space-y-3">
          {((result.top_matching_sections || []) as TopSection[]).slice(0, 5).map((item, idx) => (
            <div key={`${item.resume_index}-${item.jd_index}-${idx}`} className="surface rounded-xl p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Resume #{item.resume_index + 1} vs JD #{item.jd_index + 1}
                </p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{item.value}%</p>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{item.resume_chunk || "Resume segment preview unavailable."}</p>
            </div>
          ))}
          {!result.top_matching_sections?.length && (
            <p className="text-sm text-[var(--text-muted)]">No section-level data available for this analysis.</p>
          )}
        </div>
      </div>

      <div className="result-reveal">
        <Heatmap data={result.heatmap_data || []} />
      </div>
    </motion.main>
  );
}
