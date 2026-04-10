import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionSnapshotFromHas } from "@/lib/subscription";

export default async function SubscriptionsPage() {
  const { has } = await auth();

  const { limits } = getSubscriptionSnapshotFromHas(has);

  return (
    <main className="clerk-subscriptions">
      <section className="subscriptions-hero">
        <p className="subscriptions-eyebrow">Plans and Billing</p>
        <h1 className="page-title-xl">
          Choose the plan that fits your reading flow
        </h1>
        <p className="subtitle max-w-3xl text-center">
          Upgrade any time with Clerk Billing. Your current plan is{" "}
          <strong className="text-brand">{limits.label}</strong>.
        </p>
      </section>

      <section
        className="subscriptions-pricing-shell"
        aria-label="Billing plans"
      >
        <PricingTable
          for="user"
          ctaPosition="bottom"
          newSubscriptionRedirectUrl="/subscriptions"
          checkoutProps={{
            appearance: {
              variables: {
                colorPrimary: "#663820",

                colorBackground: "#fff6e5",
                borderRadius: "0.75rem",
              },
            },
          }}
          appearance={{
            variables: {
              colorPrimary: "#663820",

              colorBackground: "#ffffff",
              colorNeutral: "#212a3b",
              borderRadius: "0.75rem",
            },
          }}
        />
      </section>
    </main>
  );
}
