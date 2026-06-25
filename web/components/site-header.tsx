import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";

export default async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 text-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-zinc-100">
            showman
          </Link>
          <Link
            href="/artists"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Artists
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/account"
                className="text-zinc-200 hover:text-zinc-100 transition-colors"
              >
                {session.user.name || session.user.email}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
