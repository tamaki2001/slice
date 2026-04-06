import { BookCardView } from "@/components/book-card-view";
import { BookListView } from "@/components/book-list-view";

export default function BookPage() {
  return (
    <div className="min-h-full bg-background">
      {/* A: カード型 */}
      <section className="px-6 pt-14 pb-12">
        <span className="font-sans text-stone-400 text-xs tracking-widest block mb-8">
          A — CARD
        </span>
        <div className="flex justify-center">
          <BookCardView
            coverSrc="/book-cover-sample.jpg"
            title="菜食主義者"
            subtitle="채식주의자"
            author="ハン・ガン"
            translator="きむ ふな"
          />
        </div>
      </section>

      {/* B: リスト型 */}
      <section className="px-6 pb-20">
        <span className="font-sans text-stone-400 text-xs tracking-widest block mb-8">
          B — LIST
        </span>
        <BookListView
          coverSrc="/book-cover-sample.jpg"
          title="菜食主義者"
          subtitle="채식주의자"
          author="ハン・ガン"
          translator="きむ ふな"
          description="ある日突然、肉食を拒否し始めた妻。その静かな、しかし強烈な拒絶は、やがて家族の日常を崩壊させていく。アジア圏で初のブッカー国際賞を受賞した、韓国文学の傑作。"
          tags={["読了", "韓国文学"]}
        />
      </section>
    </div>
  );
}
