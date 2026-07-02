import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";

export default async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[rgba(13,13,13,0.7)] px-4 py-4 backdrop-blur-xl sm:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black uppercase tracking-[-0.08em] text-[var(--showman-bone)]">
            Showman
          </Link>
          <Link href="/artists" className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-orange)] sm:inline">
            Artists
          </Link>
          <Link href="/#bookers" className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-orange)] sm:inline">
            Bookers
          </Link>
          {session && (
            <>
              <Link href="/team" className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-orange)] lg:inline">
                Team
              </Link>
              <Link href="/booker" className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-orange)] lg:inline">
                Booker
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          {session ? (
            <>
              <Link
                href="/account"
                className="max-w-32 truncate text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-bone)] hover:text-[var(--showman-orange)] sm:max-w-none"
              >
                {session.user.name || session.user.email}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-up" className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-orange)] sm:inline">
                Join
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-[var(--showman-orange)] hover:text-white"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
