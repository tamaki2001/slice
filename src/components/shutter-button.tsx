"use client";

export function ShutterButton({ onCapture }: { onCapture?: () => void }) {
  return (
    <button
      type="button"
      onClick={onCapture}
      aria-label="撮影"
      className="
        size-18 rounded-full
        bg-stone-100
        border-2 border-stone-300
        active:bg-stone-200
        active:scale-95
        transition-transform duration-100
      "
    />
  );
}
