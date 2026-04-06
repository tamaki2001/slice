import Image from "next/image";

export function BookCardView({
  coverSrc,
  title,
  subtitle,
  author,
  translator,
}: {
  coverSrc: string;
  title: string;
  subtitle?: string;
  author: string;
  translator?: string;
}) {
  return (
    <div className="max-w-xs rounded-lg overflow-hidden shadow-md bg-stone-100 hover:shadow-xl transition-shadow duration-300">
      <div className="aspect-[3/4] w-full bg-stone-50 flex items-center justify-center overflow-hidden">
        <Image
          src={coverSrc}
          alt={`${title} 書影`}
          width={280}
          height={373}
          className="object-contain w-full h-full p-4"
        />
      </div>

      <div className="p-4 text-center">
        <h3 className="text-lg font-bold text-stone-800 leading-tight mb-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-stone-400 mb-2">{subtitle}</p>
        )}
        <div className="text-sm text-stone-700">
          <p>{author} 著</p>
          {translator && (
            <p className="text-xs text-stone-400 mt-1">{translator} 訳</p>
          )}
        </div>
      </div>
    </div>
  );
}
