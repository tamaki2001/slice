"use client";

import { useEffect, useState } from "react";
import { fetchTimelineFeed, fetchBooksWithPreview } from "@/lib/db";
import { TimelinePage } from "./timeline-page";
import type { BookWithPreview, TimelineEntry } from "@/lib/types";

export function TimelineLoader() {
  const [feed, setFeed] = useState<TimelineEntry[]>([]);
  const [books, setBooks] = useState<BookWithPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTimelineFeed(), fetchBooksWithPreview()])
      .then(([f, b]) => {
        setFeed(f);
        setBooks(b);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="size-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <TimelinePage feed={feed} books={books} />;
}
