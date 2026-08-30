import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, statusStyles } from "@/components/ui";
import {
  daysUntil,
  displayStatus,
  formatDate,
  formatMoney,
  invoiceTotal,
} from "@/lib/format";
import { StatusActions } from "./status-actions";
import type { InvoiceWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: profile }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, clients(id, name, company, email), invoice_items(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("business_name, full_name")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  if (!data) notFound();

  const invoice = data as InvoiceWithDetails;
  const state = displayStatus(invoice);
  const items = [...(invoice.invoice_items ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const totals = invoiceTotal(items, invoice.tax_rate);
  const days = daysUntil(invoice.due_date);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/invoices"
          className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
        >
          ← All invoices
        </Link>
        <StatusActions
          id={invoice.id}
          status={invoice.status}
          editable={invoice.status !== "paid"}
        />
      </div>

      {/* The invoice itself, laid out like the printed document it stands in for. */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-rule px-8 py-8">
          <div>
            <p className="eyebrow">Invoice</p>
            <p className="num mt-1 font-display text-3xl font-semibold tracking-tight">
              {invoice.invoice_number}
            </p>
            <p className="mt-4 text-sm text-ink-soft">
              From{" "}
              <span className="font-medium text-ink">
                {profile?.business_name || profile?.full_name || "You"}
              </span>
            </p>
          </div>

          {/* Signature element: the status stamp. */}
          <div className={`pt-4 ${statusStyles[state].stamp}`}>
            <span className="stamp">{statusStyles[state].label}</span>
          </div>
        </div>

        <div className="grid gap-8 border-b border-rule px-8 py-6 sm:grid-cols-3">
          <div>
            <p className="eyebrow mb-1">Billed to</p>
            <p className="font-medium">{invoice.clients?.name}</p>
            {invoice.clients?.company ? (
              <p className="text-sm text-ink-soft">{invoice.clients.company}</p>
            ) : null}
            {invoice.clients?.email ? (
              <p className="text-sm text-ink-soft">{invoice.clients.email}</p>
            ) : null}
          </div>

          <div>
            <p className="eyebrow mb-1">Issued</p>
            <p className="num text-sm">{formatDate(invoice.issue_date)}</p>
          </div>

          <div>
            <p className="eyebrow mb-1">Due</p>
            <p className="num text-sm">{formatDate(invoice.due_date)}</p>
            {state === "overdue" ? (
              <p className="mt-1 text-xs font-medium text-red">
                {Math.abs(days)} days late
              </p>
            ) : null}
            {state === "paid" && invoice.paid_at ? (
              <p className="mt-1 text-xs font-medium text-green">
                Settled {formatDate(invoice.paid_at)}
              </p>
            ) : null}
          </div>
        </div>

        {/* Line items */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-[1fr_4rem_7rem_8rem] gap-4 border-b border-rule pb-2">
            <span className="eyebrow">Description</span>
            <span className="eyebrow text-right">Qty</span>
            <span className="eyebrow text-right">Rate</span>
            <span className="eyebrow text-right">Amount</span>
          </div>

          <div className="ledger">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_4rem_7rem_8rem] gap-4 py-3 text-sm"
              >
                <span>{item.description}</span>
                <span className="num text-right text-ink-soft">
                  {Number(item.quantity)}
                </span>
                <span className="num text-right text-ink-soft">
                  {formatMoney(Number(item.unit_price), invoice.currency)}
                </span>
                <span className="num text-right">
                  {formatMoney(
                    Number(item.quantity) * Number(item.unit_price),
                    invoice.currency,
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Subtotal</span>
              <span className="num">
                {formatMoney(totals.subtotal, invoice.currency)}
              </span>
            </div>
            {Number(invoice.tax_rate) > 0 ? (
              <div className="flex justify-between">
                <span className="text-ink-soft">
                  Tax ({Number(invoice.tax_rate)}%)
                </span>
                <span className="num">
                  {formatMoney(totals.tax, invoice.currency)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between border-t-2 border-ink pt-2">
              <span className="font-medium">Total due</span>
              <span className="num text-lg font-semibold">
                {formatMoney(totals.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes ? (
          <div className="border-t border-rule bg-paper/50 px-8 py-5">
            <p className="eyebrow mb-1">Notes</p>
            <p className="text-sm whitespace-pre-line text-ink-soft">
              {invoice.notes}
            </p>
          </div>
        ) : null}
      </Card>
    </>
  );
}
