"use server";

import { connectToDatabase } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscription-constants";
import VoiceSession from "@/database/models/voice-session.model";

export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  // Implement logic to start a voice session, e.g. create a new session in the database

  try {
    await connectToDatabase();

    // Limits/Plan to see weather user can start session

    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
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
  durationSeconds: number,
): Promise<EndSessionResult> => {
  try {
    await connectToDatabase();

    const updatedSession = await VoiceSession.findByIdAndUpdate(
      sessionId,
      {
        endedAt: new Date(),
        durationSeconds,
      },
      { new: true },
    );

    if (!updatedSession) {
      return { success: false };
    }

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
