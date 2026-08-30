import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Quill
          </Link>
          {children}
        </div>
      </main>

      {/* Ledger-paper panel: ruled lines and a specimen row of figures,
          so the sign-in screen already shows what the product is about. */}
      <aside className="relative hidden overflow-hidden bg-ink px-12 py-16 lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 31px, #ffffff 31px 32px)",
          }}
        />
        <div className="relative max-w-md">
          <p className="eyebrow text-white/50">Accounts receivable</p>
          <h2 className="mt-3 font-display text-4xl leading-tight font-semibold text-white">
            Know exactly who owes you what.
          </h2>
          <dl className="num mt-10 space-y-3 text-white/80">
            {[
              ["INV-0007", "Northwind Studio", "₹48,000", "overdue 4 days"],
              ["INV-0006", "Kite & Co.", "₹22,500", "due in 9 days"],
              ["INV-0005", "Basil Labs", "₹64,000", "paid"],
            ].map(([number, client, amount, note]) => (
              <div
                key={number}
                className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-3 text-sm"
              >
                <span className="text-white/50">{number}</span>
                <span className="flex-1 font-sans text-white">{client}</span>
                <span>{amount}</span>
                <span className="w-28 text-right text-xs text-white/45">
                  {note}
                </span>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
