import { redirect } from "next/navigation";
import Link from "next/link";
import BookerDashboard from "@/components/booker/booker-dashboard";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/session";
import { getBookerDashboardData } from "@/server/booking/queries";

export const dynamic = "force-dynamic";

export default async function BookerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const data = await getBookerDashboardData(user.id);
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className={`${panelStyles("elevated")} p-6 sm:p-8`}>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb06a]">
            Booker setup
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)] sm:text-6xl">
            Create your booker profile first.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--showman-muted)]">
            Artist teams need to know who is asking before a request becomes serious.
          </p>
          <Link href="/onboarding?role=booker" className={`${buttonStyles("primary")} mt-6`}>
            Continue onboarding
          </Link>
        </div>
      </div>
    );
  }

  return <BookerDashboard data={data} />;
}
