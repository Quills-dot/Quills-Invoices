import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { invoiceTotal } from "@/lib/format";
import { AddClientForm } from "./client-form";
import { ClientRow } from "./client-row";
import type { Client, InvoiceWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase
      .from("invoices")
      .select("id, client_id, status, tax_rate, invoice_items(quantity, unit_price)"),
  ]);

  const list = (clients ?? []) as Client[];
  const rows = (invoices ?? []) as Pick<
    InvoiceWithDetails,
    "id" | "client_id" | "status" | "tax_rate" | "invoice_items"
  >[];

  // Roll invoices up per client so each row can show what that client owes.
  const stats = new Map<string, { count: number; outstanding: number }>();
  for (const invoice of rows) {
    const entry = stats.get(invoice.client_id) ?? { count: 0, outstanding: 0 };
    entry.count += 1;
    if (invoice.status === "sent") {
      entry.outstanding += invoiceTotal(
        invoice.invoice_items ?? [],
        invoice.tax_rate,
      ).total;
    }
    stats.set(invoice.client_id, entry);
  }

  return (
    <>
      <PageHeader
        eyebrow={`${list.length} on file`}
        title="Clients"
        action={<AddClientForm />}
      />

      {list.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Add the first person or company you bill. You'll need at least one before you can raise an invoice."
        />
      ) : (
        <Card className="ledger overflow-hidden">
          {list.map((client) => {
            const entry = stats.get(client.id) ?? { count: 0, outstanding: 0 };
            return (
              <ClientRow
                key={client.id}
                client={client}
                invoiceCount={entry.count}
                outstanding={entry.outstanding}
              />
            );
          })}
        </Card>
      )}
    </>
  );
}
