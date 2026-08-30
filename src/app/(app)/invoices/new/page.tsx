import { createClient } from "@/lib/supabase/server";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { nextInvoiceNumber } from "@/lib/format";
import { InvoiceForm } from "../invoice-form";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: numbers }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("invoices").select("invoice_number"),
  ]);

  const list = (clients ?? []) as Client[];

  // You can't bill nobody. Send people to add a client first rather than
  // showing a form with an empty, unusable dropdown.
  if (list.length === 0) {
    return (
      <>
        <PageHeader title="New invoice" />
        <EmptyState
          title="Add a client first"
          body="An invoice has to be addressed to someone. Create a client, then come back here."
          action={<ButtonLink href="/clients">Go to clients</ButtonLink>}
        />
      </>
    );
  }

  const suggested = nextInvoiceNumber(
    (numbers ?? []).map((row) => row.invoice_number as string),
  );

  return (
    <>
      <PageHeader eyebrow="Draft" title="New invoice" />
      <InvoiceForm clients={list} suggestedNumber={suggested} />
    </>
  );
}
