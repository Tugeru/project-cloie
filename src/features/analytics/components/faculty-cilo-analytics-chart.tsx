"use client";

import type { PieLabelRenderProps } from "recharts";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FacultyAnalyticsData } from "../types";

type FacultyCiloAnalyticsChartProps = {
  data: FacultyAnalyticsData[];
};

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#0891b2", // cyan
  "#c026d3", // fuchsia
  "#ea580c", // orange
  "#4f46e5", // indigo
  "#15803d", // green
  "#be185d", // pink
  "#0d9488", // teal
];

export function FacultyCiloAnalyticsChart({ data }: FacultyCiloAnalyticsChartProps) {
  // Aggregate CILO metrics across all evaluations
  const ciloMap = new Map<string, { label: string; description: string; values: number[] }>();

  for (const evalData of data) {
    for (const cilo of evalData.ciloMetrics) {
      const key = cilo.ciloId || cilo.bindingId;
      if (!ciloMap.has(key)) {
        ciloMap.set(key, {
          label: cilo.ciloLabel,
          description: cilo.ciloDescription,
          values: [],
        });
      }
      const entry = ciloMap.get(key)!;
      if (cilo.mean !== null && cilo.responseCount > 0) {
        // Weight by response count
        for (let i = 0; i < cilo.responseCount; i++) {
          entry.values.push(cilo.mean);
        }
      }
    }
  }

  const chartData = Array.from(ciloMap.entries())
    .map(([key, value]) => {
      const mean =
        value.values.length > 0 ? value.values.reduce((a, b) => a + b, 0) / value.values.length : 0;
      return {
        name: value.label,
        key,
        value: parseFloat(mean.toFixed(2)),
        description: value.description,
      };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">CILO Mean Attainment</CardTitle>
          <CardDescription>No CILO data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground text-sm">
              No CILO-bound quantitative responses yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">CILO Mean Attainment</CardTitle>
        <CardDescription>Mean scores per Course Intended Learning Outcome</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={3}
              label={({ name, value }: PieLabelRenderProps) => `${name}: ${value}`}
              labelLine
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const item = chartData.find((d) => d.name === name);
                return [`Mean: ${value}`, item?.description || name];
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                fontSize: "13px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value: string) => {
                const item = chartData.find((d) => d.name === value);
                return item ? `${value} (${item.value})` : value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
