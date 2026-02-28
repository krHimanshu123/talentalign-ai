import { useState } from "react";
import { motion } from "framer-motion";

import api from "../lib/api";

type Props = {
  analysisId?: number;
  rawAnalysis?: any;
};

export default function InterviewKitPanel({ analysisId, rawAnalysis }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kit, setKit] = useState<any>(null);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = analysisId ? { analysis_result_id: analysisId } : { raw_analysis: rawAnalysis };
      const { data } = await api.post("/interview-kit/generate", payload);
      setKit(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to generate interview kit.");
    } finally {
      setLoading(false);
    }
  };

  const exportHtml = () => {
    if (!kit?.content) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Interview Kit</title></head><body><h1>Interview Kit</h1><pre>${JSON.stringify(kit.content, null, 2)}</pre></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-kit-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass rounded-card p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Interview Kit Generator</h3>
        <div className="flex gap-2">
          <button className="rounded-lg bg-skyline px-3 py-2 text-sm font-semibold text-white" onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate Interview Kit"}
          </button>
          {!!kit && <button className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" onClick={exportHtml}>Export HTML</button>}
          {!!kit && <button className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(kit.content, null, 2))}>Copy</button>}
        </div>
      </div>
      {error && <p className="mb-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      {!!kit?.content && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div>
            <h4 className="font-semibold">Rubric</h4>
            <div className="mt-2 overflow-auto rounded-lg border border-white/20">
              <table className="w-full text-sm">
                <thead className="bg-white/10">
                  <tr>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Weight</th>
                    <th className="p-2 text-left">Guide</th>
                  </tr>
                </thead>
                <tbody>
                  {(kit.content.rubric || []).map((r: any) => (
                    <tr key={r.category} className="border-t border-white/10">
                      <td className="p-2">{r.category}</td>
                      <td className="p-2">{r.weight}</td>
                      <td className="p-2">{r.guide}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Questions</h4>
            <div className="mt-2 space-y-3">
              {Object.entries(kit.content.questions || {}).map(([cat, arr]: any) => (
                <div key={cat} className="surface rounded-lg p-3">
                  <p className="mb-2 font-semibold capitalize">{cat}</p>
                  {(arr || []).map((q: any, i: number) => (
                    <div key={`${cat}-${i}`} className="mb-2 text-sm">
                      <p>{i + 1}. {q.question}</p>
                      <p className="text-xs text-[var(--text-muted)]">Probes: {(q.probes || []).join(" | ")}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Red Flags</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {(kit.content.red_flags || []).map((f: string) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}