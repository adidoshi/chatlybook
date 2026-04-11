export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

export const PLANS = {
  FREE: "free",
  STANDARD: "standard",
  PRO: "pro",
} as const;

export type PlanType = (typeof PLANS)[keyof typeof PLANS];

export type PlanLimits = {
  label: string;
  maxBooks: number;
  maxSessionsPerMonth: number | null;
  maxSessionMinutes: number;
  hasSessionHistory: boolean;
};

export const CLERK_PLAN_KEYS = {
  STANDARD: "user:standard",
  PRO: "user:pro",
} as const;

export const SUBSCRIPTION_LIMITS: Record<PlanType, PlanLimits> = {
  [PLANS.FREE]: {
    label: "Free",
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxSessionMinutes: 5,
    hasSessionHistory: false,
  },
  [PLANS.STANDARD]: {
    label: "Standard",
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxSessionMinutes: 15,
    hasSessionHistory: true,
  },
  [PLANS.PRO]: {
    label: "Pro",
    maxBooks: 100,
    maxSessionsPerMonth: null,
    maxSessionMinutes: 60,
    hasSessionHistory: true,
  },
};

export const getPlanLimits = (plan: PlanType): PlanLimits => {
  return SUBSCRIPTION_LIMITS[plan];
};
