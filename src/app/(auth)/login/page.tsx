"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn, type AuthState } from "../actions";
import { Button, Field, FormError, inputClass } from "@/components/ui";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={formAction} className="mt-10 space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Pick up where your invoices left off.
        </p>
      </div>

      <input type="hidden" name="next" value={next} />

      <FormError message={state.error} />

      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Password">
        <input
          className={inputClass}
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-sm text-ink-soft">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-blue underline">
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
