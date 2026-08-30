"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createInvoice,
  updateInvoice,
  type InvoiceFormState,
} from "./actions";
import { Button, Field, FormError, inputClass } from "@/components/ui";
import { formatMoney, invoiceTotal } from "@/lib/format";
import type { Client, InvoiceWithDetails } from "@/lib/types";

type Row = { key: string; description: string; quantity: string; unit_price: string };

let rowCounter = 0;
const blankRow = (): Row => ({
  key: `row-${rowCounter++}`,
  description: "",
  quantity: "1",
  unit_price: "",
});

export function InvoiceForm({
  clients,
  suggestedNumber,
  invoice,
}: {
  clients: Client[];
  suggestedNumber?: string;
  invoice?: InvoiceWithDetails;
}) {
  const editing = Boolean(invoice);
  const [state, formAction, pending] = useActionState<InvoiceFormState, FormData>(
    editing ? updateInvoice : createInvoice,
    {},
  );

  const [rows, setRows] = useState<Row[]>(() => {
    if (invoice?.invoice_items?.length) {
      return [...invoice.invoice_items]
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          key: `row-${rowCounter++}`,
          description: item.description,
          quantity: String(item.quantity),
          unit_price: String(item.unit_price),
        }));
    }
    return [blankRow()];
  });

  const [taxRate, setTaxRate] = useState(String(invoice?.tax_rate ?? 0));

  // Totals recompute as you type, using the same helper the invoice
  // page uses, so the preview can't disagree with the saved figure.
  const totals = invoiceTotal(
    rows.map((row) => ({
      quantity: Number(row.quantity) || 0,
      unit_price: Number(row.unit_price) || 0,
    })),
    Number(taxRate) || 0,
  );

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const inThirtyDays = new Date(Date.now() + 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return (
    <form action={formAction} className="space-y-8">
      {editing ? <input type="hidden" name="id" value={invoice!.id} /> : null}

      {/* --- Header details --- */}
      <section className="rounded-lg border border-rule bg-surface p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Bill to">
            <select
              className={inputClass}
              name="client_id"
              defaultValue={invoice?.client_id ?? ""}
              required
            >
              <option value="" disabled>
                Choose a client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {client.company ? ` — ${client.company}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Invoice number">
            <input
              className={`${inputClass} num`}
              name="invoice_number"
              defaultValue={invoice?.invoice_number ?? suggestedNumber ?? ""}
              required
            />
          </Field>

          <Field label="Issue date">
            <input
              className={inputClass}
              type="date"
              name="issue_date"
              defaultValue={invoice?.issue_date ?? today}
              required
            />
          </Field>

          <Field label="Due date">
            <input
              className={inputClass}
              type="date"
              name="due_date"
              defaultValue={invoice?.due_date ?? inThirtyDays}
              required
            />
          </Field>
        </div>
      </section>

      {/* --- Line items --- */}
      <section className="rounded-lg border border-rule bg-surface">
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <h2 className="font-display text-lg font-semibold">Line items</h2>
          <Button
            type="button"
            intent="quiet"
            onClick={() => setRows((current) => [...current, blankRow()])}
          >
            Add line
          </Button>
        </div>

        <div className="ledger">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_5rem_7rem_2rem] items-end gap-3 px-6 py-4"
            >
              <label className="block">
                {index === 0 ? (
                  <span className="eyebrow mb-1.5 block">Description</span>
                ) : null}
                <input
                  className={inputClass}
                  name="item_description"
                  value={row.description}
                  onChange={(event) =>
                    updateRow(row.key, { description: event.target.value })
                  }
                  placeholder="Homepage redesign"
                />
              </label>

              <label className="block">
                {index === 0 ? (
                  <span className="eyebrow mb-1.5 block">Qty</span>
                ) : null}
                <input
                  className={`${inputClass} num text-right`}
                  name="item_quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.quantity}
                  onChange={(event) =>
                    updateRow(row.key, { quantity: event.target.value })
                  }
                />
              </label>

              <label className="block">
                {index === 0 ? (
                  <span className="eyebrow mb-1.5 block">Rate</span>
                ) : null}
                <input
                  className={`${inputClass} num text-right`}
                  name="item_unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.unit_price}
                  onChange={(event) =>
                    updateRow(row.key, { unit_price: event.target.value })
                  }
                  placeholder="0.00"
                />
              </label>

              <button
                type="button"
                aria-label={`Remove line ${index + 1}`}
                disabled={rows.length === 1}
                onClick={() =>
                  setRows((current) => current.filter((r) => r.key !== row.key))
                }
                className="mb-2 text-lg text-ink-soft hover:text-red disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* --- Running total --- */}
        <div className="border-t border-rule bg-paper/60 px-6 py-5">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Subtotal</span>
              <span className="num">{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-ink-soft">
                Tax
                <input
                  className="num w-16 rounded border border-rule bg-surface px-2 py-1 text-right text-xs"
                  name="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                />
                %
              </label>
              <span className="num">{formatMoney(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-rule pt-2 font-medium">
              <span>Total</span>
              <span className="num text-base">{formatMoney(totals.total)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Notes --- */}
      <section className="rounded-lg border border-rule bg-surface p-6">
        <Field label="Notes" hint="Payment terms, bank details, a thank you.">
          <textarea
            className={inputClass}
            name="notes"
            rows={3}
            defaultValue={invoice?.notes ?? ""}
          />
        </Field>
      </section>

      <div className="space-y-3">
        <FormError message={state.error} />
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Save as draft"}
          </Button>
          <Link
            href={editing ? `/invoices/${invoice!.id}` : "/invoices"}
            className="inline-flex items-center rounded-md border border-rule bg-surface px-4 py-2 text-sm font-medium hover:border-ink"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
