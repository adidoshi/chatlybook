"use client";

import useVapi from "@/hooks/useVapi";
import Transcript from "@/components/Transcript";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";

const formatDuration = (durationSeconds: number) => {
  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(1, "0");
  const seconds = (durationSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "connecting":
      return {
        displayText: "Connecting",
        applyColorClass: "vapi-status-dot vapi-status-dot-connecting",
      };
    case "starting":
      return {
        displayText: "Starting",
        applyColorClass: "vapi-status-dot vapi-status-dot-starting",
      };
    case "listening":
      return {
        displayText: "Listening",
        applyColorClass: "vapi-status-dot vapi-status-dot-listening",
      };
    case "thinking":
      return {
        displayText: "Thinking",
        applyColorClass: "vapi-status-dot vapi-status-dot-thinking",
      };
    case "speaking":
      return {
        displayText: "Speaking",
        applyColorClass: "vapi-status-dot vapi-status-dot-speaking",
      };
    default:
      return {
        displayText: "Ready",
        applyColorClass: "vapi-status-dot vapi-status-dot-ready",
      };
  }
};

const VapiControls = ({ book }: { book: IBook }) => {
  const coverURL = book.coverURL || "/assets/book-cover.svg";
  const persona = book.persona?.trim() || "Default";
  const {
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
    maxDurationSeconds,
  } = useVapi(book);

  const showPulseRing =
    isActive && (status === "thinking" || status === "speaking");
  const statusLabel = getStatusLabel(status);

  return (
    <>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {limitError ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="flex items-start justify-between gap-3">
              <p>{limitError}</p>
              <button
                type="button"
                onClick={clearErrors}
                className="shrink-0 rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-700"
              >
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        <section className="vapi-header-card">
          <div className="vapi-cover-wrapper">
            <Image
              src={coverURL}
              alt={book.title}
              width={120}
              height={180}
              className="vapi-cover-image"
            />

            <div className="vapi-mic-wrapper">
              {showPulseRing ? (
                <span className="vapi-pulse-ring" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                className={`vapi-mic-btn ${isActive ? "vapi-mic-btn-active" : "vapi-mic-btn-inactive"}`}
                onClick={isActive ? stop : start}
                disabled={status === "connecting"}
              >
                {isActive ? (
                  <Mic className="size-6 text-white" />
                ) : (
                  <MicOff className="size-6 text-[#212a3b]" />
                )}
              </button>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="space-y-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black leading-tight">
                {book.title}
              </h1>
              <p className="text-lg text-[#3d485e]">by {book.author}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="vapi-status-indicator">
                <span className={statusLabel.applyColorClass} />
                <span className="vapi-status-text">
                  {statusLabel.displayText}
                </span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">Voice: {persona}</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">
                  {formatDuration(duration)}/
                  {formatDuration(maxDurationSeconds)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="vapi-transcript-wrapper">
          <Transcript
            messages={messages}
            currentMessage={currentMessage}
            currentUserMessage={currentUserMessage}
          />
        </section>
      </div>
    </>
  );
};

export default VapiControls;
