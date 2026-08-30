"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClientFormState = { error?: string; ok?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    company: String(formData.get("company") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createClientRecord(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const fields = readForm(formData);
  if (!fields.name) return { error: "A client needs a name." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("clients")
    .insert({ ...fields, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateClientRecord(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const id = String(formData.get("id") ?? "");
  const fields = readForm(formData);
  if (!id) return { error: "Missing client id." };
  if (!fields.name) return { error: "A client needs a name." };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("clients")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  return { ok: true };
}

export async function deleteClientRecord(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, user } = await requireUser();

  // The invoices table uses ON DELETE RESTRICT, so a client with billing
  // history cannot be deleted out from under its invoices. Check first so
  // the person gets a sentence instead of a Postgres error code.
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("client_id", id)
    .eq("user_id", user.id);

  if (count && count > 0) {
    revalidatePath("/clients");
    return;
  }

  await supabase.from("clients").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
