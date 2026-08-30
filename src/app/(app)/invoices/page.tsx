import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  StatusPill,
} from "@/components/ui";
import {
  daysUntil,
  displayStatus,
  formatDate,
  formatMoney,
  invoiceTotal,
} from "@/lib/format";
import type { DisplayStatus, InvoiceWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Awaiting payment" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
] as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filter = "all" } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select("*, clients(id, name, company, email), invoice_items(*)")
    .order("issue_date", { ascending: false });

  const invoices = (data ?? []) as InvoiceWithDetails[];

  // Filtering happens on the derived status, so "Overdue" can be a tab even
  // though no such value exists in the database.
  const visible =
    filter === "all"
      ? invoices
      : invoices.filter((invoice) => displayStatus(invoice) === filter);

  return (
    <>
      <PageHeader
        eyebrow={`${invoices.length} raised`}
        title="Invoices"
        action={<ButtonLink href="/invoices/new">New invoice</ButtonLink>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = filter === option.key;
          const count =
            option.key === "all"
              ? invoices.length
              : invoices.filter((i) => displayStatus(i) === option.key).length;

          return (
            <Link
              key={option.key}
              href={
                option.key === "all" ? "/invoices" : `/invoices?status=${option.key}`
              }
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-rule bg-surface text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {option.label}
              <span className="num ml-1.5 text-xs opacity-70">{count}</span>
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={
            invoices.length === 0 ? "No invoices yet" : "Nothing in this view"
          }
          body={
            invoices.length === 0
              ? "Raise your first invoice and it'll show up here as a draft until you send it."
              : "Try another filter, or raise a new invoice."
          }
          action={<ButtonLink href="/invoices/new">New invoice</ButtonLink>}
        />
      ) : (
        <Card className="ledger overflow-hidden">
          {visible.map((invoice) => {
            const state = displayStatus(invoice) as DisplayStatus;
            const { total } = invoiceTotal(
              invoice.invoice_items ?? [],
              invoice.tax_rate,
            );
            const days = daysUntil(invoice.due_date);

            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-paper/70"
              >
                <span className="num w-24 text-sm text-ink-soft">
                  {invoice.invoice_number}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {invoice.clients?.name ?? "Unknown client"}
                  </span>
                  <span className="block text-xs text-ink-soft">
                    Issued {formatDate(invoice.issue_date)} · due{" "}
                    {formatDate(invoice.due_date)}
                    {state === "sent" && days >= 0
                      ? ` (${days === 0 ? "today" : `in ${days}d`})`
                      : ""}
                    {state === "overdue" ? ` (${Math.abs(days)}d late)` : ""}
                  </span>
                </span>

                <StatusPill status={state} />

                <span className="num w-28 text-right font-medium">
                  {formatMoney(total, invoice.currency)}
                </span>
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
}
