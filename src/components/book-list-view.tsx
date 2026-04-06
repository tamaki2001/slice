import Image from "next/image";

export function BookListView({
  coverSrc,
  title,
  subtitle,
  author,
  translator,
  description,
  tags,
}: {
  coverSrc: string;
  title: string;
  subtitle?: string;
  author: string;
  translator?: string;
  description?: string;
  tags?: string[];
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row bg-stone-100 rounded-lg overflow-hidden border border-stone-200 hover:bg-stone-50 transition-colors duration-200">
      <div className="w-full sm:w-1/3 bg-stone-50 flex-shrink-0 flex items-center justify-center p-4">
        <Image
          src={coverSrc}
          alt={`${title} 書影`}
          width={200}
          height={267}
          className="object-contain max-h-48"
        />
      </div>

      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          <div className="mb-3">
            <h3 className="text-xl font-bold text-stone-800">{title}</h3>
            {subtitle && (
              <p className="text-sm text-stone-400">{subtitle}</p>
            )}
          </div>

          <div className="text-sm text-stone-700 mb-4 space-y-1">
            <p>
              <span className="font-semibold">著者:</span> {author}
            </p>
            {translator && (
              <p>
                <span className="font-semibold">訳者:</span> {translator}
              </p>
            )}
          </div>

          {description && (
            <p className="font-serif text-sm text-stone-600 leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
        </div>

        {tags && tags.length > 0 && (
          <div className="mt-4 pt-3 border-t border-stone-200 flex gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
