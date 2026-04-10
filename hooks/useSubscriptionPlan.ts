"use client";

import { useAuth } from "@clerk/nextjs";
import { getSubscriptionSnapshotFromHas } from "@/lib/subscription";

export const useSubscriptionPlan = () => {
  const { isLoaded, isSignedIn, has } = useAuth();
  const subscription = getSubscriptionSnapshotFromHas(
    isLoaded ? has : undefined,
  );

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    ...subscription,
  };
};
