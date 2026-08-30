# Quill — invoice tracking for freelancers

Freelancers lose money to bookkeeping, not to bad work. An invoice gets raised,
emailed, and then forgotten until the client happens to pay. Quill keeps every
invoice in one of four honest states so you always know what's owed, what's
late, and who to email today.

**Live app:** _add your deployed URL here_
**Demo login:** `demo@example.com` / `demo1234`

---

## What it does

**Authentication** — email and password sign-up, sign-in, and sign-out via
Supabase Auth. Sessions live in HTTP-only cookies refreshed by middleware.

**CRUD** — full create, read, update and delete on invoices (the core entity)
and on clients. Invoices own a variable number of line items, edited inline.

**Business flow** — the journey the app exists for:

```
add client → draft invoice → send → record payment → settled
```

Each step is a status transition, and the transitions are enforced on the
server. An invoice can't jump from draft straight to paid.

---

## Stack

| Layer    | Choice                                  |
| -------- | --------------------------------------- |
| Framework| Next.js 15 (App Router, Server Actions) |
| Language | TypeScript                              |
| Styling  | Tailwind CSS v4                         |
| Auth     | Supabase Auth (`@supabase/ssr`)         |
| Database | Supabase Postgres with Row Level Security |
| Hosting  | Vercel                                  |

There is no API layer. Mutations are Server Actions that talk to Postgres
directly, which removes a whole tier of routes, fetch calls and loading states.

---

## Running it locally

**1. Install**

```bash
npm install
```

**2. Create a Supabase project**

At [supabase.com](https://supabase.com) → New project. Wait for it to finish
provisioning.

**3. Create the schema**

In the Supabase dashboard, open **SQL Editor → New query**, paste the entire
contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. That
creates the four tables, the sign-up trigger, and all Row Level Security
policies.

**4. Turn off email confirmation** (so a reviewer can sign up instantly)

**Authentication → Sign In / Providers → Email** → switch off *Confirm email*.

**5. Add your keys**

```bash
cp .env.example .env.local
```

Fill in both values from **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is safe in the browser. It grants nothing on its own — Row Level
Security decides what each request can actually read or write.

**6. Run**

```bash
npm run dev
```

Open http://localhost:3000.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Add the same two environment variables under **Environment Variables**.
4. Deploy.

No build configuration needed; Vercel detects Next.js automatically.

---

## How it's put together

```
src/
├── middleware.ts              Refreshes the session, guards every route
├── lib/
│   ├── supabase/
│   │   ├── client.ts          Browser client
│   │   ├── server.ts          Server client (per-request, cookie-aware)
│   │   └── middleware.ts      Session refresh + redirect rules
│   ├── format.ts              Money, dates, totals, derived status
│   └── types.ts               Shared row types
├── components/ui.tsx          Buttons, fields, status pills
└── app/
    ├── page.tsx               Public landing page
    ├── (auth)/                Sign in / sign up  + auth actions
    └── (app)/                 Everything behind the login wall
        ├── dashboard/         Outstanding total + who to chase
        ├── clients/           Client CRUD
        └── invoices/          Invoice CRUD + status transitions
```

### Four decisions worth explaining

**1. Row Level Security is the security boundary, not the app code.**
Every table has a policy restricting rows to `auth.uid()`. If a query in the
app forgot its `user_id` filter, Postgres would still return nothing. The app
code filters as well, but it isn't trusted to.

Line items have no `user_id` of their own — ownership is inherited from the
parent invoice through an `EXISTS` subquery, so there's one place that defines
who owns an invoice.

**2. "Overdue" is computed, never stored.**
The `status` column only holds `draft`, `sent`, `paid`, `void`. Overdue is
derived at read time from `status = 'sent' AND due_date < today`. A stored
overdue flag would need a nightly job and would be wrong between runs; a
derived one is right the moment the clock passes midnight.

**3. Invoice totals are computed from line items, never cached.**
There's no `total` column. Storing one means two sources of truth that can
drift apart after an edit. The same `invoiceTotal()` helper runs in the form
preview and on the invoice page, so what you see while typing is what gets
saved.

**4. Status transitions are a state machine on the server.**
`ALLOWED_TRANSITIONS` in `invoices/actions.ts` defines the legal moves. The UI
only renders buttons for legal moves, but the server re-checks, so a
hand-crafted POST can't mark an unsent invoice as paid. Paid invoices are also
locked against editing — a settled invoice is a financial record, and letting
it change would mean the numbers no longer match what the client actually paid.

---

## Testing the whole flow

1. Sign up. A profile row is created automatically by a Postgres trigger.
2. **Clients → Add a client.**
3. **Invoices → New invoice.** The number is suggested from your highest
   existing one. Add a couple of line items and watch the total update.
4. Save as draft, then **Send to client**. It moves to *Awaiting payment* and
   appears on the dashboard.
5. Set the due date to a past date and reload — it turns *Overdue* on its own.
6. **Record payment.** Stamped paid, and it drops out of your outstanding total.

---

## Known limitations

- Sending an invoice changes its status; it does not send a real email. Wiring
  Resend or Supabase Edge Functions to the same action is the natural next step.
- No PDF export yet. The invoice page prints cleanly, but there's no download.
- Partial payments aren't supported — an invoice is either paid or it isn't.
- Currency is fixed to INR per account rather than selectable per invoice.
