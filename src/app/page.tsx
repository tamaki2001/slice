import { TimelinePage } from "@/components/timeline-page";
import { fetchTimelineFeed, fetchBooksWithPreview } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const feed = await fetchTimelineFeed();
  const books = await fetchBooksWithPreview();

  return <TimelinePage feed={feed} books={books} />;
}
