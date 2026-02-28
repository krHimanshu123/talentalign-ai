import { motion } from "framer-motion";

type Props = {
  overlap: string[];
  missing: string[];
};

const Badge = ({ label, tone }: { label: string; tone: "good" | "bad" }) => (
  <span
    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
      tone === "good"
        ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
        : "border-rose-400/35 bg-rose-500/15 text-rose-700 dark:text-rose-200"
    }`}
  >
    {label}
  </span>
);

export default function SkillGapList({ overlap, missing }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 md:grid-cols-2">
      <div className="glass rounded-card p-4 shadow-soft">
        <h4 className="mb-3 font-bold">Overlapping Skills</h4>
        <div className="flex flex-wrap gap-2">
          {overlap.length ? (
            overlap.map((item) => <Badge key={item} label={item} tone="good" />)
          ) : (
            <span className="text-sm text-[var(--text-muted)]">No overlaps detected.</span>
          )}
        </div>
      </div>
      <div className="glass rounded-card p-4 shadow-soft">
        <h4 className="mb-3 font-bold">Missing Skills</h4>
        <div className="flex flex-wrap gap-2">
          {missing.length ? (
            missing.map((item) => <Badge key={item} label={item} tone="bad" />)
          ) : (
            <span className="text-sm text-[var(--text-muted)]">No missing skills found.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
