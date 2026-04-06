import type { Slice } from "@/lib/types";

function QuoteBlock({ slice }: { slice: Slice }) {
  return (
    <div className="border-l-2 border-stone-200 pl-6">
      <p className="font-serif text-stone-600 text-sm leading-relaxed italic">
        {slice.body}
      </p>
      {slice.reference && (
        <span className="font-sans text-stone-400 text-xs tracking-widest mt-2 block">
          {slice.reference}
        </span>
      )}
    </div>
  );
}

function ReflectionBlock({ slice }: { slice: Slice }) {
  return (
    <div className="pl-8">
      <p className="font-serif text-stone-800 text-sm leading-loose">
        {slice.body}
      </p>
      <span className="font-sans text-stone-400 text-xs tracking-widest mt-2 block text-right">
        {formatTime(slice.createdAt)}
      </span>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

type QuoteThread = {
  quote: Slice;
  reflections: Slice[];
};

function buildThreads(slices: Slice[]): QuoteThread[] {
  const quotes = slices.filter((s) => s.type === "quote");
  const reflections = slices.filter((s) => s.type === "reflection");

  return quotes.map((q) => ({
    quote: q,
    reflections: reflections
      .filter((r) => r.quoteId === q.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
  }));
}

export function SliceThread({ slices }: { slices: Slice[] }) {
  const threads = buildThreads(slices);

  return (
    <div className="px-8 py-6 space-y-12">
      {threads.map((thread) => (
        <div key={thread.quote.id} className="space-y-6">
          <QuoteBlock slice={thread.quote} />
          {thread.reflections.map((r) => (
            <ReflectionBlock key={r.id} slice={r} />
          ))}
        </div>
      ))}
    </div>
  );
}
