import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  onChange: (file: File | null) => void;
  accept?: string;
};

export default function UploadCard({ title, subtitle, onChange, accept = ".pdf,.docx" }: Props) {
  return (
    <motion.label whileHover={{ y: -3 }} className="glass block cursor-pointer rounded-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-lg font-bold">
        <UploadCloud className="h-5 w-5 text-skyline" />
        {title}
      </div>
      <p className="mb-4 text-sm text-[var(--text-muted)]">{subtitle}</p>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="input-field text-sm"
      />
    </motion.label>
  );
}
