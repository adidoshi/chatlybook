import { useEffect, useRef, useState } from "react";
import { IBook, Messages } from "@/types";
import {
  endVoiceSession,
  startVoiceSession,
} from "@/lib/actions/session.actions";
import Vapi from "@vapi-ai/web";

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

const useVapi = (book: IBook) => {
  // TODO: Implement limits per user

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [currentUserMessage, setCurrentUserMessage] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timeRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  const isActive =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking" ||
    status === "starting";

  // Set this based on user subscription limits
  //   const maxDurationRef = useLatestRef(0);

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
    const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID;
    setLimitError(null);
    setStatus("connecting");
    setDuration(0);
    setMessages([]);
    setCurrentMessage("");
    setCurrentUserMessage("");

    try {
      const result = await startVoiceSession(book._id);

      if (!result.success) {
        setLimitError(
          result.error || "Unable to start session. Please try again.",
        );
        setStatus("idle");
        return;
      }

      sessionIdRef.current = result.sessionId || null;

      const firstMessage = `Hey, good to meet you. Quick question, before we dive in: have you actually read ${book.title} yet? Or are we starting fresh?`;

      setStatus("starting");

      await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
      });
    } catch (error) {
      console.error("Error starting VAPI session:", error);
      if (sessionIdRef.current) {
        endVoiceSession(sessionIdRef.current).catch((e) => {
          console.error(
            "Failed to rollback voice session after start failure",
            e,
          );
          sessionIdRef.current = null;
        });
      }
      setStatus("idle");
      setLimitError(
        "An error occurred while starting the session. Please try again.",
      );
    }
  };
  const stop = async () => {
    isStoppingRef.current = true;
    await getVapi().stop();
  };
  const clearErrors = async () => {
    setLimitError(null);
  };

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
      setStatus("idle");
      setLimitError("An error occurred during the call. Please try again.");
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
    limitError,
    start,
    stop,
    clearErrors,
  };
};

export default useVapi;
