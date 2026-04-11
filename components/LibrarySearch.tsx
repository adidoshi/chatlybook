"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LibrarySearchProps = {
  initialQuery: string;
};

const SEARCH_PARAM_KEY = "query";
const DEBOUNCE_MS = 350;

export default function LibrarySearch({ initialQuery }: LibrarySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);

  const currentQuery = useMemo(
    () => searchParams.get(SEARCH_PARAM_KEY) ?? "",
    [searchParams],
  );

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextQuery = value.trim();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (nextQuery) {
        nextSearchParams.set(SEARCH_PARAM_KEY, nextQuery);
      } else {
        nextSearchParams.delete(SEARCH_PARAM_KEY);
      }

      const nextUrl = nextSearchParams.toString()
        ? `${pathname}?${nextSearchParams.toString()}`
        : pathname;

      router.replace(nextUrl, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [currentQuery, pathname, router, searchParams, value]);

  return (
    <div className="library-search-wrapper">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="library-search-input"
        placeholder="Search by title or author"
        aria-label="Search books"
      />
    </div>
  );
}
