"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

export default function HomeLogoLink({ className }: { className: string }) {
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (isModifiedClick || event.button !== 0 || pathname !== "/") return;

    event.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  return (
    <Link href="/" className={className} onClick={handleClick}>
      Showman
    </Link>
  );
}
