import SignUpForm from "@/components/sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; artist?: string }>;
}) {
  const { role, artist } = await searchParams;
  const initialIntent = role === "booker" || artist ? "booker" : "artist";

  return <SignUpForm initialIntent={initialIntent} requestedArtist={artist} />;
}
