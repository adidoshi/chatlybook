import { auth } from "@clerk/nextjs/server";
import { getSubscriptionSnapshotFromHas } from "@/lib/subscription";

export const getServerSubscription = async () => {
  const { userId, has } = await auth();
  const snapshot = getSubscriptionSnapshotFromHas(has);

  return {
    userId,
    ...snapshot,
  };
};
