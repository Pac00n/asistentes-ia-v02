import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MetricsData {
  name: string;
  total: number;
  successful: number;
  failed: number;
}

interface MetricsChartProps {
  title: string;
  description?: string;
  data: MetricsData[];
}

export function MetricsChart({ title, description, data }: MetricsChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Asegura que el componente se monte correctamente para evitar SSR hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="pl-2 h-80">
          <div className="h-full w-full flex items-center justify-center">
            Cargando gráfica...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
                color: theme === "dark" ? "#F9FAFB" : "#374151",
                border: "none",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            />
            <Bar
              dataKey="total"
              fill="#6B7280"
              radius={[4, 4, 0, 0]}
              name="Total"
            />
            <Bar
              dataKey="successful"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              name="Exitosas"
            />
            <Bar
              dataKey="failed"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
              name="Fallidas"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
