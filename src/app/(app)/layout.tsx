import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import { NavLinks } from "./nav-links";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The middleware already redirects signed-out visitors. This is the
  // second lock: it guarantees no page below ever renders without a user.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const businessName = profile?.business_name || profile?.full_name || user.email;

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
          <Link
            href="/dashboard"
            className="font-display text-lg font-semibold tracking-tight"
          >
            Quill
          </Link>

          <NavLinks />

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-ink-soft sm:inline">
              {businessName}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
