"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonStyles } from "@/components/ui/button";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={buttonStyles("ghost")}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
