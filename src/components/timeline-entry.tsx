export function TimelineEntry({
  label,
  excerpt,
}: {
  label: string;
  excerpt: string;
}) {
  return (
    <div className="p-8 bg-stone-50 mb-0 border border-stone-100 rounded">
      <span className="text-stone-400 font-sans text-xs tracking-widest block mb-4">
        {label}
      </span>
      <div className="overflow-hidden">
        <div className="w-16 h-24 bg-stone-200 float-left mr-6 mb-2" />
        <p className="font-serif text-stone-800 leading-relaxed text-sm">
          {excerpt}
        </p>
      </div>
    </div>
  );
}
