"use client";

import type { PieLabelRenderProps } from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CourseMeanData = {
  courseCode: string;
  courseTitle: string;
  mean: number;
  responseCount: number;
};

type CourseMeanPieChartProps = {
  data: CourseMeanData[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0891b2",
  "#c026d3",
  "#ea580c",
  "#4f46e5",
  "#15803d",
  "#be185d",
  "#0d9488",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseMeanPieChart({ data }: CourseMeanPieChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Overall Mean by Course
          </CardTitle>
          <CardDescription>
            Quantitative mean scores grouped by course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No quantitative response data available yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Overall Mean by Course
        </CardTitle>
        <CardDescription>
          Quantitative mean scores grouped by course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              dataKey="mean"
              nameKey="courseCode"
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={50}
              paddingAngle={3}
              label={({ name, value }: PieLabelRenderProps) =>
                `${name}: ${value}`
              }
              labelLine
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`Mean: ${value}`, name]}
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
                const item = data.find((d) => d.courseCode === value);
                return item
                  ? `${value} — ${item.courseTitle} (${item.responseCount} responses)`
                  : value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
