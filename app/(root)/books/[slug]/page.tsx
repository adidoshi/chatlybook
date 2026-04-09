import VapiControls from "@/components/VapiControls";
import { getBookBySlug } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
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

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating" aria-label="Back to library">
        <ArrowLeft className="size-5 text-[#212a3b]" />
      </Link>

      <VapiControls book={book} />
    </main>
  );
};

export default Page;
