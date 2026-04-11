import { SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
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

  return (
    <main className="auth-wrapper">
      <SignIn
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </main>
  );
}
