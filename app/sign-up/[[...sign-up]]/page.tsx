import { SignUp } from "@clerk/nextjs";
import { resolveAuthRedirectUrls } from "@/lib/auth-redirect";

type SignUpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const { redirectUrl, fallbackRedirectUrl, crossRedirectUrl } =
    resolveAuthRedirectUrls(
      params.redirect_url,
      params.fallback_redirect_url,
    );

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
