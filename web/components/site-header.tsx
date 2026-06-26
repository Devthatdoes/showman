import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";
import { buttonStyles } from "@/components/ui/button";

export default async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--showman-line)] bg-[rgba(9,9,8,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-xl font-black tracking-[-0.06em] text-[var(--showman-bone)]">
            showman
          </Link>
          <Link href="/artists" className="hidden text-sm font-medium text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-bone)] sm:inline">
            Artists
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {session ? (
            <>
              <Link
                href="/account"
                className="max-w-32 truncate text-sm font-medium text-[var(--showman-bone)] hover:text-[#ffb06a] sm:max-w-none"
              >
                {session.user.name || session.user.email}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={buttonStyles("ghost")}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonStyles("primary")}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
