import {
  CLERK_PLAN_KEYS,
  getPlanLimits,
  PLANS,
  PlanLimits,
  PlanType,
} from "@/lib/subscription-constants";

type HasPlanCheck =
  | ((params: { plan: `user:${string}` | `org:${string}` }) => boolean)
  | undefined;

export type SubscriptionSnapshot = {
  plan: PlanType;
  limits: PlanLimits;
};

export const getPlanFromHas = (has: HasPlanCheck): PlanType => {
  if (!has) {
    return PLANS.FREE;
  }

  if (has({ plan: CLERK_PLAN_KEYS.PRO })) {
    return PLANS.PRO;
  }

  if (has({ plan: CLERK_PLAN_KEYS.STANDARD })) {
    return PLANS.STANDARD;
  }

  return PLANS.FREE;
};

export const getSubscriptionSnapshotFromHas = (
  has: HasPlanCheck,
): SubscriptionSnapshot => {
  const plan = getPlanFromHas(has);

  return {
    plan,
    limits: getPlanLimits(plan),
  };
};

export const evaluateLimit = (
  used: number,
  limit: number | null,
): {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
} => {
  if (limit === null) {
    return {
      allowed: true,
      used,
      limit,
      remaining: null,
    };
  }

  const remaining = Math.max(limit - used, 0);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
};
