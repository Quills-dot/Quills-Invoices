"use client";

import { useState } from "react";
import { EditClientForm } from "./client-form";
import { deleteClientRecord } from "./actions";
import { formatMoney } from "@/lib/format";
import type { Client } from "@/lib/types";

export function ClientRow({
  client,
  invoiceCount,
  outstanding,
}: {
  client: Client;
  invoiceCount: number;
  outstanding: number;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditClientForm client={client} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{client.name}</p>
        <p className="truncate text-sm text-ink-soft">
          {[client.company, client.email].filter(Boolean).join(" · ") ||
            "No company or email on file"}
        </p>
      </div>

      <div className="text-right">
        <p className="num text-sm">{formatMoney(outstanding)}</p>
        <p className="text-xs text-ink-soft">
          outstanding · {invoiceCount}{" "}
          {invoiceCount === 1 ? "invoice" : "invoices"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-blue underline-offset-4 hover:underline"
        >
          Edit
        </button>

        {invoiceCount === 0 ? (
          <form action={deleteClientRecord}>
            <input type="hidden" name="id" value={client.id} />
            <button
              type="submit"
              className="text-sm font-medium text-red underline-offset-4 hover:underline"
            >
              Delete
            </button>
          </form>
        ) : (
          <span
            className="cursor-help text-sm text-ink-soft/70"
            title="Clients with invoices can't be deleted — the billing history depends on them."
          >
            Delete
          </span>
        )}
      </div>
    </div>
  );
}
