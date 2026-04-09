"use server";

import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import VoiceSession from "@/database/models/voice-session.model";
import Book from "@/database/models/book.model";

export const startVoiceSession = async (
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const book = await Book.findOne({ _id: bookId, clerkId: user.id })
      .select("_id")
      .lean();

    if (!book) {
      return {
        success: false,
        error: "Book not found or access denied.",
      };
    }

    // Limits/Plan to see weather user can start session
    const startedAt = new Date();

    const session = await VoiceSession.create({
      clerkId: user.id,
      bookId,
      startedAt,
      billingPeriodStart: getCurrentBillingPeriodStart(), // This could be the start of the month or based on user's billing cycle
      durationSeconds: 0, // This will be updated when the session ends
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      // maxDurationMinutes: maxDurationRef.current, // This should be set based on user's subscription plan
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
    const user = await currentUser();
    if (!user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const session = await VoiceSession.findOne({
      _id: sessionId,
      clerkId: user.id,
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
