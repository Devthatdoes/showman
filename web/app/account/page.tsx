import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
          <div className="flex flex-col gap-2">
            <p className="text-zinc-100 font-medium">{user.name}</p>
            <p className="text-zinc-400 text-sm">{user.email}</p>
            <p className="text-zinc-500 text-xs font-mono">{user.id}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <SignOutButton />
            <Link
              href="/artists"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Browse artists
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
