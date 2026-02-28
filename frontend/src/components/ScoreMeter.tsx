import { motion } from "framer-motion";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

export default function ScoreMeter({ score }: { score: number }) {
  const data = [{ name: "score", value: score, fill: "#1074FE" }];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-card p-4 shadow-soft">
      <h3 className="text-lg font-bold">Match Score</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="65%" outerRadius="95%" data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={14} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="-mt-6 text-center text-4xl font-extrabold">{score}%</p>
    </motion.div>
  );
}
