import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ZAxis } from "recharts";

export default function Heatmap({ data }: { data: Array<Record<string, any>> }) {
  return (
    <div className="glass rounded-card p-4 shadow-soft">
      <h3 className="mb-4 text-lg font-bold">Section Match Heatmap</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis type="number" dataKey="resume_index" name="Resume Section" allowDecimals={false} />
            <YAxis type="number" dataKey="jd_index" name="JD Section" allowDecimals={false} />
            <ZAxis type="number" dataKey="value" range={[20, 220]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value) => `${Number(value ?? 0)}%`} />
            <Scatter data={data} fill="#39D98A" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

