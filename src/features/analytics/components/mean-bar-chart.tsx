"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MeanDatum = {
  label: string;
  value: number | null;
};

type MeanBarChartProps = {
  title: string;
  data: MeanDatum[];
};

const COLORS = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#db2777", "#059669"];

export function MeanBarChart({ title, data }: MeanBarChartProps) {
  const chartData = data.map((entry) => ({ ...entry, chartValue: entry.value ?? 0 }));

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="h-72 w-full rounded-xl border border-border p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ bottom: 10, left: 0, right: 0, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 5]} tickCount={6} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(_value, _name, item) => {
                const original = (item?.payload as MeanDatum | undefined)?.value;
                return [original == null ? "N/A" : original.toFixed(2), "Mean"];
              }}
            />
            <Bar dataKey="chartValue" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`${entry.label}-${index}`}
                  fill={entry.value === null ? "#cbd5e1" : COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
