"use client";

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

// 時間差（時間単位）から余白pxを対数スケールで算出
const hoursAgo = [1, 2, 168];
function gapPx(i: number): number {
  if (i === 0) return 0;
  const diff = hoursAgo[i] - hoursAgo[i - 1];
  // 密: 1h差→24px, 疎: 166h差→210px
  return Math.round(Math.log2(diff + 1) * 28);
}

export function ArchiveScreen() {
  return (
    <div className="h-full overflow-y-auto bg-background">
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
    </div>
  );
}
