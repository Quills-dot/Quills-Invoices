"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createClientRecord,
  updateClientRecord,
  type ClientFormState,
} from "./actions";
import { Button, Field, FormError, inputClass } from "@/components/ui";
import type { Client } from "@/lib/types";

/** Add form: collapsed to a single button until it's needed. */
export function AddClientForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(
    createClientRecord,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Add a client</Button>;
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="w-full rounded-lg border border-rule bg-surface p-5"
    >
      <h2 className="font-display text-lg font-semibold">New client</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input className={inputClass} name="name" required autoFocus />
        </Field>
        <Field label="Company">
          <input className={inputClass} name="company" />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" name="email" />
        </Field>
        <Field label="Notes">
          <input className={inputClass} name="notes" />
        </Field>
      </div>

      <div className="mt-4 space-y-3">
        <FormError message={state.error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save client"}
          </Button>
          <Button type="button" intent="quiet" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Edit form: swaps in place of the client's row. */
export function EditClientForm({
  client,
  onDone,
}: {
  client: Client;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(
    updateClientRecord,
    {},
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="p-5">
      <input type="hidden" name="id" value={client.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            className={inputClass}
            name="name"
            defaultValue={client.name}
            required
            autoFocus
          />
        </Field>
        <Field label="Company">
          <input
            className={inputClass}
            name="company"
            defaultValue={client.company ?? ""}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            name="email"
            defaultValue={client.email ?? ""}
          />
        </Field>
        <Field label="Notes">
          <input
            className={inputClass}
            name="notes"
            defaultValue={client.notes ?? ""}
          />
        </Field>
      </div>

      <div className="mt-4 space-y-3">
        <FormError message={state.error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" intent="quiet" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
