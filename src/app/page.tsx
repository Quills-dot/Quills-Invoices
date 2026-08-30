import Link from "next/link";

const flow = [
  {
    step: "Add the client",
    detail: "Name, company, email. Once, then reuse it on every invoice.",
  },
  {
    step: "Raise the invoice",
    detail: "Line items, tax, due date. It saves as a draft you can still change.",
  },
  {
    step: "Send it",
    detail: "The invoice locks to sent, and starts counting down to its due date.",
  },
  {
    step: "Record the payment",
    detail: "Marked paid, stamped with the date, out of your outstanding total.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-semibold tracking-tight">
          Quill
        </span>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-blue px-4 py-2 font-medium text-white hover:bg-ink"
          >
            Start tracking
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">Invoicing for freelancers</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Chasing payments is a filing problem.
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-soft">
              Quill keeps every invoice in one of four honest states — draft,
              sent, paid, overdue — so you always know which client to email
              and how much is riding on it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-ink"
              >
                Create a free account
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-rule bg-surface px-5 py-2.5 text-sm font-medium hover:border-ink"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* A specimen invoice, in the app's own type and rules. */}
          <div className="rounded-lg border border-rule bg-surface p-7 shadow-[0_1px_0_var(--color-rule)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Invoice</p>
                <p className="num font-display text-2xl font-semibold">
                  INV-0007
                </p>
              </div>
              <span className="stamp text-red">Overdue</span>
            </div>

            <div className="ledger mt-7 text-sm">
              {[
                ["Brand identity — second pass", "1", "₹36,000"],
                ["Illustration set", "4", "₹12,000"],
              ].map(([description, qty, amount]) => (
                <div
                  key={description}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <span className="flex-1">{description}</span>
                  <span className="num text-ink-soft">{qty}</span>
                  <span className="num w-20 text-right">{amount}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t-2 border-ink pt-3">
              <span className="font-medium">Total due</span>
              <span className="num text-lg font-semibold">₹48,000</span>
            </div>
          </div>
        </section>

        {/* Numbered because this genuinely is a sequence — each state
            unlocks the next one. */}
        <section className="border-t border-rule py-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Four steps, in order
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((item, index) => (
              <li key={item.step}>
                <p className="num text-sm text-blue">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-medium">{item.step}</h3>
                <p className="mt-1 text-sm text-ink-soft">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-rule px-6 py-8 text-sm text-ink-soft">
        Built with Next.js and Supabase.
      </footer>
    </div>
  );
}
