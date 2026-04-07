import { BookLoader } from "@/components/book-loader";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookLoader bookId={id} />;
}
