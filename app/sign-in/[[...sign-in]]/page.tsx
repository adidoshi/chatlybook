import { SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const redirectParam = searchParams.redirect_url;
  const fallbackParam = searchParams.fallback_redirect_url;

  const redirectUrl =
    typeof redirectParam === "string" ? redirectParam : undefined;
  const fallbackRedirectUrl =
    typeof fallbackParam === "string" ? fallbackParam : "/";

  return (
    <main className="auth-wrapper">
      <SignIn
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </main>
  );
}
