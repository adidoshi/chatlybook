import { SignIn } from "@clerk/nextjs";
import { resolveAuthRedirectUrls } from "@/lib/auth-redirect";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const { redirectUrl, fallbackRedirectUrl, crossRedirectUrl } =
    resolveAuthRedirectUrls(
      params.redirect_url,
      params.fallback_redirect_url,
    );

  return (
    <main className="auth-wrapper">
      <SignIn
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={fallbackRedirectUrl}
        signUpForceRedirectUrl={crossRedirectUrl}
        signUpFallbackRedirectUrl={crossRedirectUrl}
      />
    </main>
  );
}
