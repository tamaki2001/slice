"use client";

import { TimelineEntry } from "./timeline-entry";

const entries = [
  {
    id: "1",
    excerpt:
      "第2章読了。アンラーニングの本質は、忘れることではなく、新しいレンズを手に入れることだ。文体も美しい。",
    timestamp: "1時間前",
    gap: "mb-6",
  },
  {
    id: "2",
    excerpt:
      "物語の輪郭がぼんやりとしか見えない。それが心地よい。すべてを理解しなくても、ただそこに居ることが許される本。",
    timestamp: "2時間前",
    gap: "pb-32",
  },
  {
    id: "3",
    excerpt:
      "最初の一文で呼吸が変わった。久しぶりに、読み終わるのが惜しいと思える一冊に出会えた。",
    timestamp: "1週間前",
    gap: "",
  },
];

export function ArchiveScreen() {
  return (
    <div className="min-h-full bg-background overflow-y-auto">
      <div className="px-4 pt-14 pb-20">
        {entries.map((entry) => (
          <div key={entry.id} className={entry.gap}>
            <TimelineEntry
              excerpt={entry.excerpt}
              timestamp={entry.timestamp}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
