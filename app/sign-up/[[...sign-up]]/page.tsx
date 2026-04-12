import { SignUp } from "@clerk/nextjs";

type SignUpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const redirectParam = params.redirect_url;
  const fallbackParam = params.fallback_redirect_url;

  const isSafeRedirect = (value: string) =>
    value.startsWith("/") && !value.startsWith("//");

  const redirectUrl =
    typeof redirectParam === "string" && isSafeRedirect(redirectParam)
      ? redirectParam
      : undefined;
  const fallbackRedirectUrl =
    typeof fallbackParam === "string" && isSafeRedirect(fallbackParam)
      ? fallbackParam
      : "/";
  const crossRedirectUrl = redirectUrl ?? fallbackRedirectUrl;

  return (
    <main className="auth-wrapper">
      <SignUp
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={fallbackRedirectUrl}
        signInForceRedirectUrl={crossRedirectUrl}
        signInFallbackRedirectUrl={crossRedirectUrl}
      />
    </main>
  );
}
