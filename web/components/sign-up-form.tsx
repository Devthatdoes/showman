"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveOnboardingIntent } from "@/app/sign-up/actions";
import { authClient } from "@/lib/auth-client";
import { buttonStyles } from "@/components/ui/button";
import { fieldClassName, labelClassName } from "@/components/ui/form";
import { panelStyles } from "@/components/ui/panel";

type SignUpFormProps = {
  initialIntent: "artist" | "booker";
  requestedArtist?: string;
};

export default function SignUpForm({ initialIntent, requestedArtist }: SignUpFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<"artist" | "booker">(initialIntent);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const { error: authError } = await authClient.signUp.email({ email, password, name });
    if (authError) {
      setError(authError.message ?? "Sign up failed.");
      setPending(false);
    } else {
      await saveOnboardingIntent(intent);
      const params = new URLSearchParams({ role: intent });
      if (requestedArtist) params.set("artist", requestedArtist);
      router.push(`/onboarding?${params.toString()}`);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        <div className={`${panelStyles("elevated")} p-6 sm:p-8`}>
          <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-[var(--showman-bone)]">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--showman-muted)]">
            Access profiles, availability, and the booking rails as they come online.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className={labelClassName}>How are you entering Showman?</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="cursor-pointer rounded-2xl border border-[var(--showman-line)] bg-black/20 p-4 transition has-[:checked]:border-[#ff7a1a] has-[:checked]:bg-[rgba(255,122,26,0.12)]">
                  <input
                    type="radio"
                    name="intent"
                    value="artist"
                    checked={intent === "artist"}
                    onChange={() => setIntent("artist")}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-[var(--showman-bone)]">
                    Artist / team
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--showman-muted)]">
                    Build an artist profile, add media, and manage availability.
                  </span>
                </label>
                <label className="cursor-pointer rounded-2xl border border-[var(--showman-line)] bg-black/20 p-4 transition has-[:checked]:border-[#ff7a1a] has-[:checked]:bg-[rgba(255,122,26,0.12)]">
                  <input
                    type="radio"
                    name="intent"
                    value="booker"
                    checked={intent === "booker"}
                    onChange={() => setIntent("booker")}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-[var(--showman-bone)]">
                    Booker / promoter
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--showman-muted)]">
                    Find real artists and prepare booking requests as that lane opens.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className={labelClassName}>
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={labelClassName}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className={labelClassName}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClassName}
              />
              <p className="text-xs leading-6 text-[var(--showman-muted)]">At least 8 characters.</p>
            </div>
            {error && <p className="text-sm text-[var(--showman-danger)]">{error}</p>}
            <button type="submit" disabled={pending} className={buttonStyles("primary")}>
              {pending ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--showman-muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline underline-offset-2 hover:text-[var(--showman-bone)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
