import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import LibrarySearch from "@/components/LibrarySearch";
import { searchBooks } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

const sampleBooks = [
  {
    title: "Abdul Kalam Autobiography",
    href: "/documents/Abdul_Kalam_autobiography.pdf",
  },
  {
    title: "Eloquent JavaScript",
    href: "/documents/Eloquent_JavaScript.pdf",
  },
  {
    title: "Own Web Server From Scratch",
    href: "/documents/Own_web_server_from_scratch.pdf",
  },
  {
    title: "Sachin Tendulkar Autobiography",
    href: "/documents/Sachin_Tendulkar_autobiography.pdf",
  },
  {
    title: "The Alchemist",
    href: "/documents/The_Alchemist.pdf",
  },
] as const;

type BookListItem = {
  _id: string;
  title: string;
  author: string;
  coverURL?: string;
  slug: string;
};

type PageProps = {
  searchParams: Promise<{ query?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  const resolvedSearchParams = await searchParams;
  const queryValue = Array.isArray(resolvedSearchParams.query)
    ? resolvedSearchParams.query[0]
    : resolvedSearchParams.query;
  const searchQuery = queryValue?.trim() ?? "";

  let books: BookListItem[] = [];
  if (isSignedIn) {
    const bookResults = await searchBooks(searchQuery);
    if (!bookResults.success) {
      const searchError = new Error(
        typeof bookResults.error === "string"
          ? bookResults.error
          : "Failed to search books",
      );

      throw searchError;
    }

    books = (bookResults.data ?? []) as BookListItem[];
  }

  return (
    <main className="wrapper container">
      <HeroSection />
      <div className="library-filter-bar mt-5">
        <h2 className="section-title">Your Books</h2>
        {isSignedIn && <LibrarySearch initialQuery={searchQuery} />}
      </div>
      {!isSignedIn ? (
        <p className="text-center font-medium text-lg">
          Books not available - Add new
        </p>
      ) : books.length <= 1 && !searchQuery ? (
        <section className="mx-auto mt-8 max-w-2xl rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
          <p className="text-center text-lg font-medium text-slate-900">
            Download sample book PDF&apos;s from here to test out the app.
          </p>
          <p className="text-center text-sm text-slate-500">
            Once downloaded click on Add New book to upload the PDF
          </p>
          <ul className="mt-6 space-y-3">
            {sampleBooks.map((book) => (
              <li key={book.href}>
                <Link
                  href={book.href}
                  download
                  className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-black/20 hover:bg-slate-50"
                >
                  <span>{book.title}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Download
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : books.length === 0 ? (
        <p className="text-center font-medium text-lg">
          No books found for &quot;{searchQuery}&quot;.
        </p>
      ) : (
        <div className="library-books-grid">
          {books.map((book) => (
            <BookCard
              key={book._id}
              title={book.title}
              author={book.author}
              coverURL={book.coverURL}
              slug={book.slug}
            />
          ))}
        </div>
      )}
    </main>
  );
}
