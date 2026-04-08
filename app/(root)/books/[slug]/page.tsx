import { getBookBySlug } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

type BookPageProps = {
  params: Promise<{ slug: string }>;
};

const Page = async ({ params }: BookPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect("/");
  }

  const book = result.data;
  const coverURL = book.coverURL || "/assets/book-cover.svg";
  const persona = book.persona?.trim() || "Default";

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating" aria-label="Back to library">
        <ArrowLeft className="size-5 text-[#212a3b]" />
      </Link>

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
              <button type="button" className="vapi-mic-btn vapi-mic-btn-inactive">
                <MicOff className="size-6 text-[#212a3b]" />
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

        <section className="transcript-container min-h-100">
          <div className="transcript-empty">
            <Mic className="size-12 text-[#212a3b]" />
            <p className="transcript-empty-text mt-4">No conversation yet</p>
            <p className="transcript-empty-hint">
              Click the mic button above to start talking
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Page;