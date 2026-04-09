"use client";

import { Messages } from "@/types";
import { Mic } from "lucide-react";
import { useEffect, useRef } from "react";

type TranscriptProps = {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
};

const Transcript = ({
  messages,
  currentMessage,
  currentUserMessage,
}: TranscriptProps) => {
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, currentMessage, currentUserMessage]);

  const hasAssistantStream = currentMessage.trim().length > 0;
  const hasUserStream = currentUserMessage.trim().length > 0;
  const hasConversation =
    messages.length > 0 || hasAssistantStream || hasUserStream;

  if (!hasConversation) {
    return (
      <section className="transcript-container">
        <div className="transcript-empty">
          <Mic className="size-12 text-[#212a3b]" />
          <p className="transcript-empty-text mt-4">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="transcript-container">
      <div ref={messagesRef} className="transcript-messages">
        {messages.map((message, index) => {
          const isUser = message.role.toLowerCase() === "user";

          return (
            <div
              key={`${message.role}-${index}`}
              className={`transcript-message ${
                isUser
                  ? "transcript-message-user"
                  : "transcript-message-assistant"
              }`}
            >
              <div
                className={`transcript-bubble whitespace-pre-wrap ${
                  isUser
                    ? "transcript-bubble-user"
                    : "transcript-bubble-assistant"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {hasUserStream && (
          <div className="transcript-message transcript-message-user">
            <div className="transcript-bubble transcript-bubble-user whitespace-pre-wrap">
              {currentUserMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}

        {hasAssistantStream && (
          <div className="transcript-message transcript-message-assistant">
            <div className="transcript-bubble transcript-bubble-assistant whitespace-pre-wrap">
              {currentMessage}
              <span className="transcript-cursor" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Transcript;