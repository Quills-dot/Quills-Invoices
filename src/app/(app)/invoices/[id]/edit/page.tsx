import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { InvoiceForm } from "../../invoice-form";
import type { Client, InvoiceWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: clients }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, clients(id, name, company, email), invoice_items(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("clients").select("*").order("name"),
  ]);

  if (!invoice) notFound();

  // Guard the route as well as the action: a paid invoice is a closed record.
  if (invoice.status === "paid") redirect(`/invoices/${id}`);

  return (
    <>
      <PageHeader
        eyebrow={`Editing ${invoice.invoice_number}`}
        title="Edit invoice"
      />
      <InvoiceForm
        clients={(clients ?? []) as Client[]}
        invoice={invoice as InvoiceWithDetails}
      />
    </>
  );
}
