"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { buttonStyles } from "@/components/ui/button";

export default function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    // Full document navigation: router.refresh() raced the pending push and
    // cancelled it, and a hard load re-renders the header for the ended session.
    window.location.assign("/");
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
