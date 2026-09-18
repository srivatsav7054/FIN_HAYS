import { useState, type FormEvent } from "react";
import { type Transaction, type TransactionType, TRANSACTION_CATEGORIES } from "@/types";
import { X, PlusCircle, Check } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => Promise<void>;
  initialData?: Transaction | null;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type || "expense");
  const [category, setCategory] = useState<string>(initialData?.category || "Groceries");
  const [amount, setAmount] = useState<string>(initialData ? String(initialData.amount) : "");
  const [date, setDate] = useState<string>(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState<string>(initialData?.note || "");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setSubmitting(true);
    try {
      await onSave({
        id: initialData?.id || "",
        date,
        type,
        category,
        amount: Number(amount),
        note,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="surface-card w-full max-w-lg p-6 shadow-lift">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--color-foreground)]">
                {initialData ? "Edit Transaction (लेन-देन सुधारें)" : "Add Self-Reported Entry (नया लेन-देन)"}
              </h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                All records remain confidential and self-reported
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Switcher */}
          <div>
            <label className="text-xs font-bold text-[var(--color-foreground)] block mb-1.5">
              Entry Type (लेन-देन का प्रकार)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex min-h-[48px] items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                  type === "expense"
                    ? "border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-300/50"
                    : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)]"
                }`}
              >
                Expense (खर्च Outflow)
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex min-h-[48px] items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                  type === "income"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/40"
                    : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)]"
                }`}
              >
                Income (आय Inflow)
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-[var(--color-foreground)] block mb-1.5">
              Amount (राशि ₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-mono font-bold text-lg text-[var(--color-primary)]">
                ₹
              </span>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2,500"
                className="w-full rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-background)] py-3 pl-10 pr-4 font-mono text-xl font-bold focus:border-[var(--color-primary)] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-[var(--color-foreground)] block mb-1.5">
              Category (श्रेणी)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-sm font-semibold focus:border-[var(--color-primary)] focus:outline-none"
            >
              {TRANSACTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-bold text-[var(--color-foreground)] block mb-1.5">
              Date (दिनांक)
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm font-semibold focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-[var(--color-foreground)] block mb-1.5">
              Note or Purpose (विवरण / टिप्पणी)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Fertilizer & seeds, monthly ration"
              className="w-full rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] rounded-lg border border-[var(--color-border)] px-5 text-sm font-bold text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !amount}
              className="flex min-h-[48px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? "Saving..." : "Save Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
