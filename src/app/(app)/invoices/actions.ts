"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceStatus } from "@/lib/types";

export type InvoiceFormState = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

type ParsedItem = { description: string; quantity: number; unit_price: number };

/**
 * Line items arrive as three parallel arrays from the repeated form rows.
 * Rows with no description are dropped, so a person can leave spare rows
 * blank without creating empty lines on the invoice.
 */
function parseItems(formData: FormData): ParsedItem[] {
  const descriptions = formData.getAll("item_description").map(String);
  const quantities = formData.getAll("item_quantity").map(String);
  const prices = formData.getAll("item_unit_price").map(String);

  return descriptions
    .map((description, index) => ({
      description: description.trim(),
      quantity: Number(quantities[index] ?? 0),
      unit_price: Number(prices[index] ?? 0),
    }))
    .filter((item) => item.description.length > 0 && item.quantity > 0);
}

function readInvoice(formData: FormData) {
  return {
    client_id: String(formData.get("client_id") ?? ""),
    invoice_number: String(formData.get("invoice_number") ?? "").trim(),
    issue_date: String(formData.get("issue_date") ?? ""),
    due_date: String(formData.get("due_date") ?? ""),
    tax_rate: Number(formData.get("tax_rate") ?? 0),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

function validate(
  fields: ReturnType<typeof readInvoice>,
  items: ParsedItem[],
): string | null {
  if (!fields.client_id) return "Choose which client this invoice is for.";
  if (!fields.invoice_number) return "Give this invoice a number.";
  if (!fields.issue_date || !fields.due_date)
    return "Both the issue date and the due date are required.";
  if (fields.due_date < fields.issue_date)
    return "The due date can't fall before the issue date.";
  if (items.length === 0)
    return "Add at least one line item with a description and a quantity.";
  return null;
}

export async function createInvoice(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const fields = readInvoice(formData);
  const items = parseItems(formData);

  const problem = validate(fields, items);
  if (problem) return { error: problem };

  const { supabase, user } = await requireUser();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({ ...fields, user_id: user.id, status: "draft" })
    .select("id")
    .single();

  if (error) {
    // 23505 is Postgres' unique_violation — here it can only mean the
    // (user_id, invoice_number) pair is already taken.
    if (error.code === "23505")
      return { error: `You already have an invoice numbered ${fields.invoice_number}.` };
    return { error: error.message };
  }

  const { error: itemsError } = await supabase.from("invoice_items").insert(
    items.map((item, index) => ({
      ...item,
      invoice_id: invoice.id,
      position: index,
    })),
  );

  if (itemsError) {
    // Don't leave a headless invoice behind if the lines failed to save.
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { error: itemsError.message };
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const id = String(formData.get("id") ?? "");
  const fields = readInvoice(formData);
  const items = parseItems(formData);

  const problem = validate(fields, items);
  if (problem) return { error: problem };

  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  // A paid invoice is a financial record. Editing one after the fact would
  // let the numbers stop matching what the client actually settled.
  if (existing?.status === "paid")
    return { error: "Paid invoices can't be edited. Void it and raise a new one." };

  const { error } = await supabase
    .from("invoices")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505")
      return { error: `You already have an invoice numbered ${fields.invoice_number}.` };
    return { error: error.message };
  }

  // Line items are replaced wholesale rather than diffed. Simpler, and the
  // cascade delete on invoice_id keeps it consistent.
  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  await supabase.from("invoice_items").insert(
    items.map((item, index) => ({
      ...item,
      invoice_id: id,
      position: index,
    })),
  );

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
  redirect(`/invoices/${id}`);
}

/**
 * The business flow, enforced server-side.
 *
 *   draft ──send──> sent ──record payment──> paid
 *     │               │
 *     └──────void─────┴──> void
 *
 * The UI only offers legal moves, but the rule lives here as well so a
 * hand-crafted request can't jump an invoice straight from draft to paid.
 */
const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent", "void"],
  sent: ["paid", "draft", "void"],
  paid: [],
  void: ["draft"],
};

export async function changeStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "") as InvoiceStatus;

  const { supabase, user } = await requireUser();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!invoice) return;
  if (!ALLOWED_TRANSITIONS[invoice.status as InvoiceStatus]?.includes(next))
    return;

  const patch: Record<string, unknown> = { status: next };
  if (next === "sent") patch.sent_at = new Date().toISOString();
  if (next === "paid") patch.paid_at = new Date().toISOString();
  if (next === "draft") {
    patch.sent_at = null;
    patch.paid_at = null;
  }

  await supabase.from("invoices").update(patch).eq("id", id).eq("user_id", user.id);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, user } = await requireUser();

  await supabase.from("invoices").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect("/invoices");
}
