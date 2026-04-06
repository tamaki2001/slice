import { ReflectionPage } from "@/components/reflection-page";
import { mockBook, mockSlices } from "@/lib/mock-data";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: idからSupabaseで取得。現在はモックデータ。
  void id;

  return <ReflectionPage book={mockBook} slices={mockSlices} />;
}
