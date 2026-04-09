"use client";

import useVapi from "@/hooks/useVapi";
import Transcript from "@/components/Transcript";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";

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
  } = useVapi(book);

  const showPulseRing = isActive && (status === "thinking" || status === "speaking");

  return (
    <>
      <div className="mx-auto w-full max-w-4xl space-y-6">
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
              {showPulseRing ? <span className="vapi-pulse-ring" aria-hidden="true" /> : null}
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
                <span className="vapi-status-dot vapi-status-dot-ready" />
                <span className="vapi-status-text">Ready</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">Voice: {persona}</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">0:00/15:00</span>
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
