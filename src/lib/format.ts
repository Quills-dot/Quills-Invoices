import type { DisplayStatus, Invoice, InvoiceItem } from "./types";

export function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** Today as YYYY-MM-DD, which is how dates come back from Postgres. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function subtotal(items: Pick<InvoiceItem, "quantity" | "unit_price">[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  );
}

export function invoiceTotal(
  items: Pick<InvoiceItem, "quantity" | "unit_price">[],
  taxRate: number,
) {
  const sub = subtotal(items);
  const tax = sub * (Number(taxRate) / 100);
  return { subtotal: sub, tax, total: sub + tax };
}

/**
 * An invoice is overdue when it has been sent, is still unpaid, and its
 * due date has passed. Deriving it here means a sent invoice becomes
 * overdue on its own — no cron job, no stale status column.
 */
export function displayStatus(
  invoice: Pick<Invoice, "status" | "due_date">,
): DisplayStatus {
  if (invoice.status === "sent" && invoice.due_date < today()) return "overdue";
  return invoice.status;
}

export function daysUntil(dateString: string) {
  const due = new Date(dateString + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

/** Suggests INV-0007 style numbers based on the highest existing one. */
export function nextInvoiceNumber(existing: string[]) {
  const highest = existing.reduce((max, value) => {
    const match = value.match(/(\d+)\s*$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `INV-${String(highest + 1).padStart(4, "0")}`;
}
