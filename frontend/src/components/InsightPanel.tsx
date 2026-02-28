import { motion } from "framer-motion";

type Props = {
  strengths: string[];
  suggestions: string[];
};

export default function InsightPanel({ strengths, suggestions }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-card p-5 shadow-soft">
      <h3 className="mb-3 text-lg font-bold">AI Insights</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Strength Areas</h4>
          <ul className="space-y-2 text-sm">
            {strengths.map((item) => (
              <li key={item} className="surface rounded-xl p-2">{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Suggestions</h4>
          <ul className="space-y-2 text-sm">
            {suggestions.map((item) => (
              <li key={item} className="surface rounded-xl p-2">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
