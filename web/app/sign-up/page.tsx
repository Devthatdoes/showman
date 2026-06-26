"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { buttonStyles } from "@/components/ui/button";
import { fieldClassName, labelClassName } from "@/components/ui/form";
import { panelStyles } from "@/components/ui/panel";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      router.push("/account");
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
