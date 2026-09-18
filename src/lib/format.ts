/** Always mask phone numbers: keep only the last 5 digits. e.g. "XXXXX67890". */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const tail = digits.slice(-5);
  return `XXXXX${tail.padStart(5, "X")}`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(ymd: string): string {
  return new Date(ymd + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
