export function TimelineEntry({
  excerpt,
  timestamp,
}: {
  excerpt: string;
  timestamp: string;
}) {
  return (
    <div className="p-8 bg-stone-50 border border-stone-100 rounded">
      <div className="overflow-hidden">
        <div className="w-16 h-24 bg-stone-200 float-left mr-6 mb-2" />
        <p className="font-serif text-stone-800 leading-relaxed text-sm">
          {excerpt}
        </p>
      </div>
      <span className="font-sans text-stone-400 text-xs tracking-widest mt-4 block clear-both">
        {timestamp}
      </span>
    </div>
  );
}
