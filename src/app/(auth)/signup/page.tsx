"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { Button, Field, FormError, inputClass } from "@/components/ui";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    {},
  );

  return (
    <form action={formAction} className="mt-10 space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Your business name goes at the top of every invoice you raise.
        </p>
      </div>

      <FormError message={state.error} />

      <Field label="Your name">
        <input
          className={inputClass}
          name="full_name"
          autoComplete="name"
          required
        />
      </Field>

      <Field label="Business name" hint="Shown on invoices. Your own name is fine.">
        <input className={inputClass} name="business_name" required />
      </Field>

      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Password" hint="At least 6 characters.">
        <input
          className={inputClass}
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm text-ink-soft">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-blue underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
