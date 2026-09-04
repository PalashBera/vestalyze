"use client";

import { Pie, PieChart } from "recharts";
import type { AllocationSlice } from "@/lib/api/types";
import { useSettings } from "@/components/settings-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function AllocationChart({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: AllocationSlice[];
}) {
  const { money } = useSettings();
  const config = data.reduce<ChartConfig>((acc, item, index) => {
    acc[item.key] = { label: item.label, color: colors[index % colors.length] };
    return acc;
  }, {});
  const chartData = data.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span>{name}</span>
                      <span>{money(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Pie data={chartData} dataKey="amountInr" nameKey="label" />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: colors[index % colors.length] }}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
