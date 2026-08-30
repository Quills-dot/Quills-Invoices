import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Card, EmptyState, StatusPill } from "@/components/ui";
import {
  daysUntil,
  displayStatus,
  formatDate,
  formatMoney,
  invoiceTotal,
} from "@/lib/format";
import type { InvoiceWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select("*, clients(id, name, company, email), invoice_items(*)")
    .order("due_date", { ascending: true });

  const invoices = (data ?? []) as InvoiceWithDetails[];

  const withTotals = invoices.map((invoice) => ({
    invoice,
    state: displayStatus(invoice),
    total: invoiceTotal(invoice.invoice_items ?? [], invoice.tax_rate).total,
  }));

  const sum = (predicate: (row: (typeof withTotals)[number]) => boolean) =>
    withTotals.filter(predicate).reduce((acc, row) => acc + row.total, 0);

  const outstanding = sum((row) => row.state === "sent" || row.state === "overdue");
  const overdue = sum((row) => row.state === "overdue");
  const paidThisYear = sum(
    (row) =>
      row.state === "paid" &&
      row.invoice.paid_at !== null &&
      new Date(row.invoice.paid_at).getFullYear() === new Date().getFullYear(),
  );
  const draftCount = withTotals.filter((row) => row.state === "draft").length;

  // Everything unpaid, soonest due first — the queue you actually work from.
  const needsAttention = withTotals
    .filter((row) => row.state === "overdue" || row.state === "sent")
    .slice(0, 6);

  return (
    <>
      {/* The hero is the one number a freelancer opens this app to see. */}
      <section className="mb-10">
        <p className="eyebrow">Owed to you right now</p>
        <p className="num mt-2 text-6xl font-semibold tracking-tighter">
          {formatMoney(outstanding)}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {overdue > 0 ? (
            <>
              <span className="font-medium text-red">
                {formatMoney(overdue)} of that is overdue.
              </span>{" "}
              Worth a follow-up today.
            </>
          ) : outstanding > 0 ? (
            "Nothing overdue. Every sent invoice is still within its terms."
          ) : (
            "Nothing outstanding. Time to send some work out."
          )}
        </p>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Collected this year", value: formatMoney(paidThisYear) },
          { label: "Drafts not yet sent", value: String(draftCount) },
          { label: "Invoices raised", value: String(invoices.length) },
        ].map((stat) => (
          <Card key={stat.label} className="px-5 py-4">
            <p className="eyebrow">{stat.label}</p>
            <p className="num mt-1 text-2xl font-semibold">{stat.value}</p>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Waiting on payment
          </h2>
          <ButtonLink href="/invoices/new">New invoice</ButtonLink>
        </div>

        {needsAttention.length === 0 ? (
          <EmptyState
            title="Nothing outstanding"
            body="When you send an invoice it lands here until the client pays it."
            action={<ButtonLink href="/invoices/new">Raise an invoice</ButtonLink>}
          />
        ) : (
          <Card className="ledger overflow-hidden">
            {needsAttention.map(({ invoice, state, total }) => {
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
                      {invoice.clients?.name}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      Due {formatDate(invoice.due_date)}
                      {state === "overdue"
                        ? ` · ${Math.abs(days)} days late`
                        : days === 0
                          ? " · today"
                          : ` · in ${days} days`}
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
      </section>
    </>
  );
}
