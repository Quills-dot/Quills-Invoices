import Link from "next/link";
import type { DisplayStatus } from "@/lib/types";

/* ---------------------------------------------------------------
   Buttons. Three intents only — primary, quiet, danger — so the
   interface never has two things competing to be the main action.
   --------------------------------------------------------------- */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const intents = {
  primary: "bg-blue text-white hover:bg-ink",
  quiet: "border border-rule bg-surface text-ink hover:border-ink",
  danger: "border border-red/30 bg-red-soft text-red hover:border-red",
} as const;

type Intent = keyof typeof intents;

export function Button({
  intent = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { intent?: Intent }) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${intents[intent]} ${className}`}
    />
  );
}

export function ButtonLink({
  intent = "primary",
  className = "",
  href,
  children,
}: {
  intent?: Intent;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${buttonBase} ${intents[intent]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------------
   Form fields
   --------------------------------------------------------------- */

export const inputClass =
  "w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-blue focus:outline-none";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="eyebrow block">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-red/25 bg-red-soft px-3 py-2 text-sm text-red"
    >
      {message}
    </p>
  );
}

/* ---------------------------------------------------------------
   Status
   --------------------------------------------------------------- */

export const statusStyles: Record<
  DisplayStatus,
  { label: string; pill: string; stamp: string }
> = {
  draft: {
    label: "Draft",
    pill: "border-rule bg-paper text-ink-soft",
    stamp: "text-ink-soft",
  },
  sent: {
    label: "Awaiting payment",
    pill: "border-blue/25 bg-blue-soft text-blue",
    stamp: "text-blue",
  },
  overdue: {
    label: "Overdue",
    pill: "border-red/25 bg-red-soft text-red",
    stamp: "text-red",
  },
  paid: {
    label: "Paid",
    pill: "border-green/25 bg-green-soft text-green",
    stamp: "text-green",
  },
  void: {
    label: "Void",
    pill: "border-rule bg-paper text-ink-soft line-through",
    stamp: "text-ink-soft",
  },
};

export function StatusPill({ status }: { status: DisplayStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.pill}`}
    >
      {style.label}
    </span>
  );
}

/* ---------------------------------------------------------------
   Layout helpers
   --------------------------------------------------------------- */

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-rule bg-surface ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-surface/60 px-6 py-14 text-center">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
