"use client";

import Link from "next/link";
import { useState } from "react";
import { changeStatus, deleteInvoice } from "../actions";
import { Button } from "@/components/ui";
import type { InvoiceStatus } from "@/lib/types";

/**
 * Mirrors ALLOWED_TRANSITIONS in actions.ts. The server is the authority;
 * this just keeps the UI from offering a move that would be rejected.
 */
const MOVES: Record<
  InvoiceStatus,
  { status: InvoiceStatus; label: string; primary?: boolean }[]
> = {
  draft: [
    { status: "sent", label: "Send to client", primary: true },
    { status: "void", label: "Void" },
  ],
  sent: [
    { status: "paid", label: "Record payment", primary: true },
    { status: "draft", label: "Back to draft" },
  ],
  paid: [],
  void: [{ status: "draft", label: "Reopen as draft" }],
};

export function StatusActions({
  id,
  status,
  editable,
}: {
  id: string;
  status: InvoiceStatus;
  editable: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {editable ? (
        <Link
          href={`/invoices/${id}/edit`}
          className="inline-flex items-center rounded-md border border-rule bg-surface px-4 py-2 text-sm font-medium hover:border-ink"
        >
          Edit
        </Link>
      ) : null}

      {MOVES[status].map((move) => (
        <form key={move.status} action={changeStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={move.status} />
          <Button type="submit" intent={move.primary ? "primary" : "quiet"}>
            {move.label}
          </Button>
        </form>
      ))}

      {confirming ? (
        <form action={deleteInvoice} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <span className="text-sm text-ink-soft">Delete for good?</span>
          <Button type="submit" intent="danger">
            Yes, delete
          </Button>
          <Button type="button" intent="quiet" onClick={() => setConfirming(false)}>
            Keep
          </Button>
        </form>
      ) : (
        <Button type="button" intent="quiet" onClick={() => setConfirming(true)}>
          Delete
        </Button>
      )}
    </div>
  );
}
