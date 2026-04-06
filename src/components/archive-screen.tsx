"use client";

import { Camera } from "lucide-react";
import { TimelineEntry } from "./timeline-entry";

const entries = [
  {
    id: "1",
    excerpt:
      "第2章読了。アンラーニングの本質は、忘れることではなく、新しいレンズを手に入れることだ。文体も美しい。",
    timestamp: "1時間前",
  },
  {
    id: "2",
    excerpt:
      "物語の輪郭がぼんやりとしか見えない。それが心地よい。すべてを理解しなくても、ただそこに居ることが許される本。",
    timestamp: "2時間前",
  },
  {
    id: "3",
    excerpt:
      "最初の一文で呼吸が変わった。久しぶりに、読み終わるのが惜しいと思える一冊に出会えた。",
    timestamp: "1週間前",
  },
];

const hoursAgo = [1, 2, 168];
function gapPx(i: number): number {
  if (i === 0) return 0;
  const diff = hoursAgo[i] - hoursAgo[i - 1];
  return Math.round(Math.log2(diff + 1) * 28);
}

export function ArchiveScreen() {
  return (
    <div className="h-full overflow-y-auto bg-background relative">
      <div className="pt-14 pb-32">
        {entries.map((entry, i) => (
          <div key={entry.id} style={{ marginTop: i > 0 ? gapPx(i) : 0 }}>
            <TimelineEntry
              excerpt={entry.excerpt}
              timestamp={entry.timestamp}
            />
          </div>
        ))}
      </div>

      {/* FAB: 将来の書影撮影トリガー */}
      <button
        type="button"
        aria-label="書影を撮影して記録を追加"
        className="
          fixed right-6 bottom-8
          size-12 rounded-full
          bg-stone-800 text-stone-100
          active:bg-stone-700
          flex items-center justify-center
          shadow-sm
          pb-[env(safe-area-inset-bottom,0px)]
        "
      >
        <Camera size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
}
