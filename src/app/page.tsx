import { TimelinePage } from "@/components/timeline-page";
import { fetchBooksWithPreview } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let books = await fetchBooksWithPreview();

  // DB未接続時のフォールバック
  if (books.length === 0) {
    books = [
      {
        id: "1",
        title: "菜食主義者",
        author: "ハン・ガン",
        coverUrl: "/book-cover-sample.jpg",
        tags: ["読了"],
        sliceCount: 5,
        latestSlice: {
          body: "第2部に入り、視点が夫から義兄へと移ることで、ヨンヘの「変容」が他者の欲望のフィルターを通して描かれるようになる。",
          createdAt: "2026-04-07T14:20:00",
        },
      },
    ];
  }

  return <TimelinePage books={books} />;
}
