import type { Slice } from "@/lib/types";

function QuoteBlock({
  slice,
  onAddReflection,
}: {
  slice: Slice;
  onAddReflection: () => void;
}) {
  return (
    <div className="border-l-2 border-stone-200 pl-6">
      <p className="font-serif text-stone-600 text-sm leading-relaxed italic">
        {slice.body}
      </p>
      <div className="flex items-center justify-between mt-2">
        {slice.reference ? (
          <span className="font-sans text-stone-400 text-xs tracking-widest">
            {slice.reference}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onAddReflection}
          className="font-sans text-xs tracking-widest text-stone-300 active:text-stone-500 transition-colors"
        >
          + 内省
        </button>
      </div>
    </div>
  );
}

function NestedReflectionBlock({ slice }: { slice: Slice }) {
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

function StandaloneReflectionBlock({ slice }: { slice: Slice }) {
  return (
    <div>
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

type ThreadItem =
  | { kind: "quote-thread"; quote: Slice; reflections: Slice[] }
  | { kind: "standalone"; slice: Slice };

function buildThreads(slices: Slice[]): ThreadItem[] {
  const quotes = slices.filter((s) => s.type === "quote");
  const linkedReflections = slices.filter(
    (s) => s.type === "reflection" && s.quoteId
  );
  const standaloneReflections = slices.filter(
    (s) => s.type === "reflection" && !s.quoteId
  );

  const quoteThreads = quotes.map((q) => ({
    kind: "quote-thread" as const,
    quote: q,
    reflections: linkedReflections
      .filter((r) => r.quoteId === q.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    sortKey: new Date(q.createdAt).getTime(),
  }));

  const standalones = standaloneReflections.map((s) => ({
    kind: "standalone" as const,
    slice: s,
    sortKey: new Date(s.createdAt).getTime(),
  }));

  return [...quoteThreads, ...standalones]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((item) =>
      item.kind === "quote-thread"
        ? { kind: "quote-thread", quote: item.quote, reflections: item.reflections }
        : { kind: "standalone", slice: item.slice }
    );
}

export function SliceThread({
  slices,
  onReplyToQuote,
}: {
  slices: Slice[];
  onReplyToQuote?: (quoteId: string) => void;
}) {
  const threads = buildThreads(slices);

  return (
    <div className="px-8 py-6 space-y-12">
      {threads.map((item) => {
        if (item.kind === "quote-thread") {
          return (
            <div key={item.quote.id} className="space-y-6">
              <QuoteBlock
                slice={item.quote}
                onAddReflection={() => onReplyToQuote?.(item.quote.id)}
              />
              {item.reflections.map((r) => (
                <NestedReflectionBlock key={r.id} slice={r} />
              ))}
            </div>
          );
        }
        return (
          <StandaloneReflectionBlock key={item.slice.id} slice={item.slice} />
        );
      })}
    </div>
  );
}
