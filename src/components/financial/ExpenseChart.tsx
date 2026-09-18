import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { type Transaction } from "@/types";

interface ExpenseChartProps {
  transactions: Transaction[];
}

const COLORS = [
  "#4a7a58", // Primary Sage
  "#c86d44", // Terracotta
  "#d97706", // Amber
  "#475569", // Slate
  "#0d9488", // Teal
  "#8b5cf6", // Purple
];

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    const expenseOnly = transactions.filter((t) => t.type === "expense");
    const totals: Record<string, number> = {};

    expenseOnly.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  const totalExpense = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <div className="surface-card flex h-64 items-center justify-center p-6 text-sm text-[var(--color-muted-foreground)]">
        No expense transactions recorded yet.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.06, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="surface-card space-y-4 p-6 hover:surface-card-hover"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
        <div>
          <h4 className="font-display text-lg font-bold text-[var(--color-foreground)]">
            Expense Breakdown by Category (खर्च विवरण)
          </h4>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Visual breakdown of self-reported household & farming outflows
          </p>
        </div>
        <div className="font-mono text-sm font-bold text-[var(--color-primary)]">
          Total: ₹{totalExpense.toLocaleString("en-IN")}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              animationDuration={800}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [
                `₹${Number(value || 0).toLocaleString("en-IN")}`,
                "Amount",
              ]}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(val) => (
                <span className="text-xs font-semibold text-[var(--color-foreground)]">
                  {val}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
