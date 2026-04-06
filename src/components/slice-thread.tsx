import type { Slice } from "@/lib/types";

function QuoteBlock({ slice }: { slice: Slice }) {
  return (
    <div className="px-8 py-6">
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
    </div>
  );
}

function ReflectionBlock({ slice }: { slice: Slice }) {
  return (
    <div className="px-8 py-6">
      <p className="font-serif text-stone-800 text-sm leading-loose">
        {slice.body}
      </p>
      <span className="font-sans text-stone-400 text-xs tracking-widest mt-3 block text-right">
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

export function SliceThread({ slices }: { slices: Slice[] }) {
  return (
    <div className="divide-y divide-stone-100">
      {slices.map((s) => {
        switch (s.type) {
          case "quote":
            return <QuoteBlock key={s.id} slice={s} />;
          case "reflection":
            return <ReflectionBlock key={s.id} slice={s} />;
        }
      })}
    </div>
  );
}
