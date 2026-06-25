import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-6 text-sm text-zinc-400">
          <Link href="/" className="font-semibold text-zinc-100 hover:text-zinc-100">
            showman
          </Link>
          <Link href="/artists" className="hover:text-zinc-100">
            Artists
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-semibold tracking-tight">showman</h1>
          <p className="mt-4 text-xl text-zinc-100">Verified, direct artist booking.</p>
          <p className="mt-3 max-w-sm text-sm text-zinc-400">
            This is an early build. Artist profiles are live — booking and payments come later.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/artists"
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Browse artists
            </Link>
            <Link
              href="/artists/new"
              className="inline-flex items-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Add your profile
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
