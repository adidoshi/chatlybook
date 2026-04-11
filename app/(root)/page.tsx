import BookCard from "@/components/BookCard";
import HeroSection from "@/components/HeroSection";
import LibrarySearch from "@/components/LibrarySearch";
import { searchBooks } from "@/lib/actions/book.actions";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

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
      const searchError =
        bookResults.error instanceof Error
          ? bookResults.error
          : new Error(
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
      {isSignedIn ? (
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
      ) : (
        <p className="text-center font-medium text-lg">
          Books not available - Add new
        </p>
      )}
    </main>
  );
}
