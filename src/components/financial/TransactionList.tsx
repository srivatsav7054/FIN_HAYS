import { useState } from "react";
import { type Transaction } from "@/types";
import { Plus, ArrowUpRight, ArrowDownRight, Edit2, Calendar } from "lucide-react";
import { AddTransactionModal } from "./AddTransactionModal";
import { motion } from "framer-motion";

interface TransactionListProps {
  transactions: Transaction[];
  onSaveTransaction: (tx: Transaction) => Promise<void>;
}

export function TransactionList({
  transactions,
  onSaveTransaction,
}: TransactionListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === "all") return true;
    return tx.type === filterType;
  });

  const handleOpenAdd = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  return (
    <div
      className="surface-card space-y-4 p-6 rounded-3xl"
      style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 20px -4px rgba(50, 40, 30, 0.08)" }}
    >
      {/* Header with Add Button and Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <h4 className="font-display text-lg font-extrabold text-[var(--color-foreground)]">
            Recent Transactions (नवीनतम लेन-देन विवरण)
          </h4>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Self-reported entries recorded via voice calls or manual updates
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-shimmer flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white shadow-soft transition-all hover:bg-emerald-800 hover:shadow-glow"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Transaction (नया दर्ज करें)</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pt-1 pb-2">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
            filterType === "all"
              ? "bg-[var(--color-foreground)] text-white shadow-2xs"
              : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          }`}
        >
          All ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("income")}
          className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
            filterType === "income"
              ? "bg-[var(--color-primary)] text-white shadow-2xs"
              : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          }`}
        >
          Income (+{transactions.filter((t) => t.type === "income").length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("expense")}
          className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
            filterType === "expense"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-[var(--color-secondary)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          }`}
        >
          Expenses (-{transactions.filter((t) => t.type === "expense").length})
        </button>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-[var(--color-border)]">
        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No transactions found matching this filter.
          </div>
        ) : (
          filteredTransactions.map((tx, idx) => {
            const isIncome = tx.type === "income";
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.025, ease: "easeOut" }}
                className="flex items-center justify-between py-3.5 transition-colors hover:bg-[var(--color-background)]/50 rounded-lg px-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isIncome
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--color-foreground)]">
                        {tx.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isIncome
                            ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isIncome ? "Income" : "Expense"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" />
                        <span>{tx.date}</span>
                      </span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px] sm:max-w-[320px]">
                            {tx.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`font-mono text-base font-extrabold ${
                      isIncome ? "text-[var(--color-primary)]" : "text-amber-900"
                    }`}
                  >
                    {isIncome ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => handleOpenEdit(tx)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
                    title="Edit transaction"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onSaveTransaction}
        initialData={editingTx}
      />
    </div>
  );
}
