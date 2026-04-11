"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import VoiceSession from "@/database/models/voice-session.model";
import Book from "@/database/models/book.model";
import {
  evaluateLimit,
  getSubscriptionSnapshotFromHas,
} from "@/lib/subscription";

export const startVoiceSession = async (
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    const { userId, has } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const book = await Book.findOne({ _id: bookId, clerkId: userId })
      .select("_id")
      .lean();

    if (!book) {
      return {
        success: false,
        error: "Book not found or access denied.",
      };
    }

    const subscription = getSubscriptionSnapshotFromHas(has);
    const billingPeriodStart = getCurrentBillingPeriodStart();

    const sessionCount = await VoiceSession.countDocuments({
      clerkId: userId,
      billingPeriodStart,
    });

    const limitCheck = evaluateLimit(
      sessionCount,
      subscription.limits.maxSessionsPerMonth,
    );

    if (!limitCheck.allowed) {
      const monthlyLimit = subscription.limits.maxSessionsPerMonth;

      return {
        success: false,
        isBillingError: true,
        maxDurationMinutes: subscription.limits.maxSessionMinutes,
        error:
          monthlyLimit === null
            ? "Unable to start session right now. Please try again."
            : `You have reached your ${subscription.limits.label} plan limit of ${monthlyLimit} voice sessions this month. Upgrade your plan to continue.`,
      };
    }

    const startedAt = new Date();

    const session = await VoiceSession.create({
      clerkId: userId,
      bookId,
      startedAt,
      billingPeriodStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: subscription.limits.maxSessionMinutes,
    };
  } catch (error) {
    console.error("Error starting voice session:", error);
    return {
      success: false,
      error:
        "An error occurred while starting the voice session. Please try again.",
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
): Promise<EndSessionResult> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const session = await VoiceSession.findOne({
      _id: sessionId,
      clerkId: userId,
    });

    if (!session) {
      return {
        success: false,
        error: "Session not found or access denied.",
      };
    }

    if (session.endedAt) {
      return { success: true };
    }

    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    session.endedAt = endedAt;
    session.durationSeconds = durationSeconds;
    await session.save();

    return { success: true };
  } catch (error) {
    console.error("Error ending voice session:", error);
    return {
      success: false,
      error:
        "An error occurred while ending the voice session. Please try again.",
    };
  }
};
