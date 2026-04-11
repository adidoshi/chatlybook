import { useCallback, useEffect, useRef, useState } from "react";
import { IBook, Messages } from "@/types";
import {
  endVoiceSession,
  startVoiceSession,
} from "@/lib/actions/session.actions";
import Vapi from "@vapi-ai/web";
import { getVoice } from "@/lib/utils";
import { DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/constants";
import { useSubscriptionPlan } from "./useSubscriptionPlan";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

let vapi: InstanceType<typeof Vapi>;

function getVapi() {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error("VAPI API key is not defined");
    }
    vapi = new Vapi(VAPI_API_KEY);
  }
  return vapi;
}

type TranscriptRole = "assistant" | "user";
type TranscriptType = "partial" | "final";

type TranscriptMessage = {
  type: "transcript" | "transcript[transcriptType='final']";
  role: TranscriptRole;
  transcriptType: TranscriptType;
  transcript: string;
};

type StatusUpdateMessage = {
  type: "status-update";
  status: string;
  endedReason?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const extractTranscriptMessage = (
  payload: unknown,
): TranscriptMessage | null => {
  const candidate =
    isRecord(payload) && isRecord(payload.message) ? payload.message : payload;

  if (!isRecord(candidate)) return null;

  const type = candidate.type;
  const role = candidate.role;
  const transcriptType = candidate.transcriptType;
  const transcript = candidate.transcript;

  const isTranscriptType =
    type === "transcript" || type === "transcript[transcriptType='final']";
  const isRole = role === "assistant" || role === "user";
  const isFinalType =
    transcriptType === "partial" || transcriptType === "final";

  if (
    isTranscriptType &&
    isRole &&
    isFinalType &&
    typeof transcript === "string"
  ) {
    return {
      type,
      role,
      transcriptType,
      transcript,
    };
  }

  return null;
};

const extractStatusUpdateMessage = (
  payload: unknown,
): StatusUpdateMessage | null => {
  const candidate =
    isRecord(payload) && isRecord(payload.message) ? payload.message : payload;

  if (!isRecord(candidate)) return null;

  if (
    candidate.type !== "status-update" ||
    typeof candidate.status !== "string"
  ) {
    return null;
  }

  const endedReason =
    typeof candidate.endedReason === "string"
      ? candidate.endedReason
      : undefined;

  return {
    type: "status-update",
    status: candidate.status,
    endedReason,
  };
};

const getCallEndMessage = (endedReason?: string) => {
  if (!endedReason) {
    return "The call ended unexpectedly. Please try again.";
  }

  if (endedReason.toLowerCase().includes("eject")) {
    return "The call was ended by the voice provider (ejected). This is usually caused by assistant call-end rules or provider-side safeguards. Please retry, and if it keeps happening, review your Vapi assistant end-call settings.";
  }

  if (endedReason === "assistant-ended-call") {
    return "The assistant ended the call. Please start a new conversation.";
  }

  return `Call ended: ${endedReason.replace(/-/g, " ")}.`;
};

const isDurationLimitEndedReason = (endedReason?: string) => {
  if (!endedReason) return false;

  const normalizedReason = endedReason.toLowerCase();

  return (
    normalizedReason.includes("max-duration") ||
    normalizedReason.includes("max duration") ||
    normalizedReason.includes("duration limit") ||
    normalizedReason.includes("time limit")
  );
};

const extractErrorText = (error: unknown): string | null => {
  if (typeof error === "string") return error;

  if (isRecord(error)) {
    if (typeof error.message === "string") return error.message;

    if (isRecord(error.error) && typeof error.error.message === "string") {
      return error.error.message;
    }
  }

  return null;
};

const getRuntimeErrorMessage = (error: unknown): string | null => {
  if (!isRecord(error)) {
    return extractErrorText(error);
  }

  const topLevelType =
    typeof error.type === "string" ? error.type.toLowerCase() : undefined;
  const errorNode = isRecord(error.error) ? error.error : undefined;
  const nestedError =
    errorNode && isRecord(errorNode.error) ? errorNode.error : undefined;
  const nestedMessage =
    errorNode && isRecord(errorNode.message) ? errorNode.message : undefined;

  const nestedType =
    (nestedError && typeof nestedError.type === "string"
      ? nestedError.type
      : undefined) ||
    (nestedMessage && typeof nestedMessage.type === "string"
      ? nestedMessage.type
      : undefined);

  const nestedMsg =
    (nestedError && typeof nestedError.msg === "string"
      ? nestedError.msg
      : undefined) ||
    (nestedMessage && typeof nestedMessage.msg === "string"
      ? nestedMessage.msg
      : undefined) ||
    (errorNode && typeof errorNode.errorMsg === "string"
      ? errorNode.errorMsg
      : undefined);

  if (
    nestedType?.toLowerCase() === "ejected" ||
    (topLevelType === "daily-error" &&
      nestedMsg?.toLowerCase() === "meeting has ended")
  ) {
    return "The voice call ended because the meeting room was closed by the provider (ejected). This usually comes from assistant end-call behavior or room-side termination, not your microphone. Please start a new call.";
  }

  return nestedMsg || extractErrorText(error);
};

const useVapi = (book: IBook) => {
  const { limits } = useSubscriptionPlan();
  const router = useRouter();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [currentUserMessage, setCurrentUserMessage] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState<number>(
    limits.maxSessionMinutes * 60,
  );

  const timeRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const didHandlePlanLimitRef = useRef<boolean>(false);

  const voice = book.persona || DEFAULT_VOICE;

  const handlePlanDurationLimitReached = useCallback(() => {
    if (didHandlePlanLimitRef.current) return;
    didHandlePlanLimitRef.current = true;

    const maxDurationMinutes = Math.floor(maxDurationSeconds / 60);
    const message = `You reached your ${limits.label} plan session limit of ${maxDurationMinutes} minutes. Upgrade your plan for longer voice sessions.`;
    setLimitError(message);
    toast.error(message);
    router.push("/subscriptions");
  }, [limits.label, maxDurationSeconds, router]);

  const handlePlanDurationLimitReachedRef = useLatestRef(
    handlePlanDurationLimitReached,
  );

  const isActive =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking" ||
    status === "starting";

  const appendUniqueFinalMessage = (message: Messages) => {
    const content = message.content.trim();
    if (!content) return;

    setMessages((previousMessages) => {
      const lastMessage = previousMessages[previousMessages.length - 1];
      const isDuplicateFinal =
        !!lastMessage &&
        lastMessage.role.toLowerCase() === message.role.toLowerCase() &&
        lastMessage.content.trim() === content;

      if (isDuplicateFinal) return previousMessages;

      return [...previousMessages, { role: message.role, content }];
    });
  };

  const start = async () => {
    if (isStartingRef.current || status !== "idle") return;
    isStartingRef.current = true;
    didHandlePlanLimitRef.current = false;
    const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID;
    setLimitError(null);
    if (!ASSISTANT_ID) {
      setLimitError("Voice assistant is not configured.");
      isStartingRef.current = false;
      return;
    }
    setStatus("connecting");
    setDuration(0);
    setMessages([]);
    setCurrentMessage("");
    setCurrentUserMessage("");

    try {
      const result = await startVoiceSession(book._id);

      if (!result.success) {
        const errorMessage =
          result.error || "Unable to start session. Please try again.";

        setLimitError(errorMessage);

        if (result.isBillingError) {
          toast.error(errorMessage);
          router.push("/subscriptions");
        }

        setStatus("idle");
        return;
      }

      const authoritativeMaxDurationSeconds =
        (result.maxDurationMinutes ?? limits.maxSessionMinutes) * 60;

      setMaxDurationSeconds(authoritativeMaxDurationSeconds);
      sessionIdRef.current = result.sessionId || null;

      const firstMessage = `Hey, good to meet you. Quick question, before we dive in: have you actually read ${book.title} yet? Or are we starting fresh?`;

      setStatus("starting");

      const call = await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        maxDurationSeconds: authoritativeMaxDurationSeconds,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
        voice: {
          provider: "11labs" as const,
          voiceId: getVoice(voice).id,
          model: "eleven_turbo_v2_5" as const,
          stability: VOICE_SETTINGS.stability,
          similarityBoost: VOICE_SETTINGS.similarityBoost,
          style: VOICE_SETTINGS.style,
          useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        },
      });

      if (!call) {
        throw new Error("Unable to connect to the voice room.");
      }
    } catch (error) {
      console.error("Error starting VAPI session:", error);
      const sessionIdToRollback = sessionIdRef.current;
      sessionIdRef.current = null;

      if (sessionIdToRollback) {
        endVoiceSession(sessionIdToRollback).catch((e) => {
          console.error(
            "Failed to rollback voice session after start failure",
            e,
          );
        });
      }
      setStatus("idle");
      setLimitError(
        getRuntimeErrorMessage(error) ||
          "An error occurred while starting the session. Please try again.",
      );
    } finally {
      isStartingRef.current = false;
    }
  };
  const stop = useCallback(async () => {
    isStoppingRef.current = true;

    try {
      await getVapi().stop();
    } catch (error) {
      console.error("Error stopping VAPI session:", error);
    } finally {
      // onCallEnd should reset this, but ensure cleanup if it never fires
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 5000);
    }
  }, []);
  const clearErrors = async () => {
    setLimitError(null);
  };

  useEffect(() => {
    if (status !== "idle" || sessionIdRef.current) return;

    setMaxDurationSeconds(limits.maxSessionMinutes * 60);
  }, [limits.maxSessionMinutes, status]);

  useEffect(() => {
    if (!isActive || isStoppingRef.current) return;
    if (duration < maxDurationSeconds) return;

    handlePlanDurationLimitReached();
    void stop();
  }, [
    duration,
    isActive,
    maxDurationSeconds,
    handlePlanDurationLimitReached,
    stop,
  ]);

  useEffect(() => {
    let instance: InstanceType<typeof Vapi>;

    try {
      instance = getVapi();
    } catch (error) {
      console.error("Error initializing VAPI:", error);
      return;
    }

    const startDurationTimer = () => {
      if (timeRef.current) clearInterval(timeRef.current);

      timeRef.current = setInterval(() => {
        setDuration((previous) => previous + 1);
      }, 1000);
    };

    const stopDurationTimer = () => {
      if (!timeRef.current) return;
      clearInterval(timeRef.current);
      timeRef.current = null;
    };

    const finalizeSession = async () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      sessionIdRef.current = null;
      const result = await endVoiceSession(sessionId);

      if (!result.success) {
        console.error(
          "Unable to persist voice session end state",
          result.error,
        );
      }
    };

    const onCallStart = () => {
      startDurationTimer();
      setStatus("listening");
    };

    const onCallEnd = () => {
      stopDurationTimer();
      setStatus("idle");
      setCurrentMessage("");
      setCurrentUserMessage("");

      void finalizeSession();
      isStoppingRef.current = false;
    };

    const onSpeechStart = () => {
      setStatus("speaking");
    };

    const onSpeechEnd = () => {
      setStatus("listening");
    };

    const onMessage = (payload: unknown) => {
      const statusMessage = extractStatusUpdateMessage(payload);

      if (statusMessage?.status === "ended") {
        if (!isStoppingRef.current) {
          if (isDurationLimitEndedReason(statusMessage.endedReason)) {
            handlePlanDurationLimitReachedRef.current();
            return;
          }

          setLimitError(getCallEndMessage(statusMessage.endedReason));
        }
        return;
      }

      const transcriptMessage = extractTranscriptMessage(payload);
      if (!transcriptMessage) return;

      const transcript = transcriptMessage.transcript;

      if (transcriptMessage.role === "user") {
        if (transcriptMessage.transcriptType === "partial") {
          setCurrentUserMessage(transcript);
          setStatus("listening");
          return;
        }

        setCurrentUserMessage("");
        appendUniqueFinalMessage({ role: "user", content: transcript });
        setStatus("thinking");
        return;
      }

      if (transcriptMessage.transcriptType === "partial") {
        setCurrentMessage(transcript);
        setStatus("speaking");
        return;
      }

      setCurrentMessage("");
      appendUniqueFinalMessage({ role: "assistant", content: transcript });
      setStatus("listening");
    };

    const onError = (error: unknown) => {
      console.error("VAPI runtime error:", error);

      stopDurationTimer();
      setStatus("idle");
      setCurrentMessage("");
      setCurrentUserMessage("");

      if (!isStoppingRef.current) {
        setLimitError(
          getRuntimeErrorMessage(error) ||
            "An error occurred during the call. Please try again.",
        );
      }

      void finalizeSession();
      isStoppingRef.current = false;
    };

    instance.on("call-start", onCallStart);
    instance.on("call-end", onCallEnd);
    instance.on("speech-start", onSpeechStart);
    instance.on("speech-end", onSpeechEnd);
    instance.on("message", onMessage);
    instance.on("error", onError);

    return () => {
      stopDurationTimer();

      instance.removeListener("call-start", onCallStart);
      instance.removeListener("call-end", onCallEnd);
      instance.removeListener("speech-start", onSpeechStart);
      instance.removeListener("speech-end", onSpeechEnd);
      instance.removeListener("message", onMessage);
      instance.removeListener("error", onError);
    };
  }, []);

  return {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    maxDurationSeconds,
    limitError,
    start,
    stop,
    clearErrors,
  };
};

export default useVapi;
