# Submission pack

Everything you need to finish and submit. Delete this file before pushing if
you'd rather it not be in the repo.

---

## Before you record: 40-minute checklist

1. **Supabase project** — create it, run `supabase/schema.sql` in the SQL
   Editor, turn off *Confirm email* under Authentication → Sign In / Providers.
2. **Run locally** — `npm install`, fill `.env.local`, `npm run dev`. Click
   through the whole flow once so nothing surprises you on camera.
3. **Seed real-looking data** — 3 clients, 5 invoices: one draft, two sent
   (make one of them due last week so it shows as overdue), two paid. An empty
   app films badly; the dashboard needs numbers on it.
4. **Create the reviewer account** — sign up as `demo@example.com` /
   `demo1234`, seed *that* account with the data above, and put those
   credentials in the README and the Google Form.
5. **Push to GitHub** — repo `quill-invoices` under `mayanknagpal3107`, public.
6. **Deploy to Vercel** — import the repo, add the two environment variables,
   deploy. Open the live URL and sign in as the demo user to confirm it works.
7. **Update the README** — paste the live URL at the top.

---

## Loom script (aim for 6 minutes)

Record your screen with the live deployed app, not localhost. Talk over it
rather than reading — the marks are for clarity, and reading is audible.

### 0:00 — The problem (45s)

> Freelancers don't lose money on bad work, they lose it on bad follow-up. You
> send an invoice, it disappears into an inbox, and three weeks later you're
> not sure whether it was ever paid. I built Quill, an invoice tracker that
> keeps every invoice in one of four states so you always know what's owed and
> who to chase today.

### 0:45 — The flow, live (2m 30s)

Sign in as the demo user. Then walk the flow without narrating every click:

- **Dashboard** — "The one number this app exists to show: what's owed right
  now, and how much of it is late."
- **Clients** — add one live. "Full CRUD. Note that a client with invoices
  can't be deleted — the billing history depends on it."
- **New invoice** — add two line items. "The total updates as I type, and it's
  computed from the line items rather than stored, so it can't drift."
- **Save as draft → Send to client** — "That's the transition that matters. It
  stamps a sent time and starts the countdown to the due date."
- **Open the overdue one** — "This invoice was never marked overdue by anyone.
  It's derived: sent, unpaid, past its due date."
- **Record payment** — "Stamped paid, and watch the outstanding figure on the
  dashboard drop."

### 3:15 — How it's built (2m)

Have `supabase/schema.sql` and `invoices/actions.ts` open in tabs to switch to.

- **Stack**: "Next.js 15 with the App Router, TypeScript, Tailwind v4, and
  Supabase for both auth and Postgres. Deployed on Vercel."
- **No API layer**: "Every mutation is a Server Action. The form posts straight
  to a function that runs on the server and talks to Postgres. No fetch calls,
  no route handlers, no client-side loading states."
- **Show the schema.** "Four tables. The important part is Row Level Security —
  every table has a policy restricting rows to the signed-in user. If my app
  code forgot a `user_id` filter, Postgres would still return nothing. The
  database is the security boundary, not my code."
- **Show `ALLOWED_TRANSITIONS`.** "The business flow is a state machine, and
  it's enforced server-side. The UI only shows legal buttons, but the server
  re-checks, so you can't POST your way from draft to paid."
- **One honest trade-off**: "I replace all line items on every edit instead of
  diffing them. It's more writes, but it's simple and it can't get out of sync.
  At freelancer scale that's the right trade."

### 5:15 — Limitations and close (45s)

> Two things I'd do next. Sending an invoice changes its status but doesn't
> send a real email yet — the action is the right hook for Resend. And there's
> no PDF export. Both are additive; neither changes the data model.

---

## Google Form answers

**App Name**
Quill

**One-line description**
An invoice tracker that shows freelancers exactly what's owed, what's overdue,
and who to chase.

**Tools & stack used**
Next.js 15 (App Router, Server Actions), TypeScript, Tailwind CSS v4, Supabase
Auth and Supabase Postgres with Row Level Security, deployed on Vercel.
Claude was used for scaffolding and code review.

**Test credentials**
Email: demo@example.com
Password: demo1234
Sign up also works if you'd prefer a fresh account — email confirmation is off.

**Anything that doesn't work yet / known issues**
Sending an invoice changes its status but does not dispatch a real email; the
action is wired for it but no mail provider is connected. No PDF export.
Partial payments aren't supported — an invoice is either paid or unpaid.
Currency is fixed to INR.

---

## One honest note

The evaluation asks you to explain your architecture and decisions on camera,
and 25% of the grade rides on that. Read `README.md` → "Four decisions worth
explaining" and make sure you could defend each one if someone pushed back. If
a decision doesn't make sense to you, change it to one that does — that's a
better video than reciting mine.
