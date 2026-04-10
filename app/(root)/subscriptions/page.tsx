import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  SUBSCRIPTION_LIMITS,
  PlanType,
  PLANS,
} from "@/lib/subscription-constants";
import { getSubscriptionSnapshotFromHas } from "@/lib/subscription";

const planOrder: PlanType[] = [PLANS.FREE, PLANS.STANDARD, PLANS.PRO];

const formatSessionLimit = (limit: number | null) => {
  if (limit === null) {
    return "Unlimited";
  }

  return `${limit} / month`;
};

export default async function SubscriptionsPage() {
  const { userId, has } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { plan, limits } = getSubscriptionSnapshotFromHas(has);

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
        className="subscriptions-limits-grid"
        aria-label="Plan limits overview"
      >
        {/* {planOrder.map((planKey) => {
          const planLimits = SUBSCRIPTION_LIMITS[planKey];
          const isCurrent = plan === planKey;

          return (
            <article
              key={planKey}
              className={`subscriptions-limit-card ${isCurrent ? "subscriptions-limit-card-active" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="section-title !text-2xl">{planLimits.label}</h2>
                {isCurrent ? (
                  <span className="subscriptions-current-pill">Current</span>
                ) : null}
              </div>
              <ul className="subscriptions-limit-list">
                <li>Books: {planLimits.maxBooks}</li>
                <li>
                  Voice sessions:{" "}
                  {formatSessionLimit(planLimits.maxSessionsPerMonth)}
                </li>
                <li>Session duration: {planLimits.maxSessionMinutes} min</li>
                <li>
                  Session history:{" "}
                  {planLimits.hasSessionHistory ? "Included" : "Not available"}
                </li>
              </ul>
            </article>
          );
        })} */}
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
