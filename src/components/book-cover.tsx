"use client";

export function BookCover({ src }: { src?: string }) {
  return (
    <div className="flex justify-center px-12 pt-12 pb-6">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-64 w-auto object-contain opacity-80 mix-blend-multiply"
        />
      ) : (
        <div className="h-64 w-44 bg-stone-200 opacity-70" />
      )}
    </div>
  );
}
