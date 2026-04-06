import { ReflectionPage } from "@/components/reflection-page";
import { fetchBook, fetchSlices } from "@/lib/db";
import { mockBook, mockSlices } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const book = await fetchBook(id);

  if (!book) {
    // DB未接続またはデータ未投入時はモックにフォールバック
    if (id === "1" || id === "mock") {
      return <ReflectionPage book={mockBook} slices={mockSlices} />;
    }
    notFound();
  }

  const slices = await fetchSlices(book.id);
  return <ReflectionPage book={book} slices={slices} />;
}
