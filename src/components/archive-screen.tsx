"use client";

import { TimelineEntry } from "./timeline-entry";

const entries = [
  {
    id: "1",
    label: "1時間前",
    excerpt:
      "言葉が静かに降り積もるような読書体験だった。著者の視線はいつも地面すれすれを這っていて、そこに咲く名もない花を丁寧に掬い上げる。",
  },
  {
    id: "2",
    label: "2時間前",
    excerpt:
      "物語の輪郭がぼんやりとしか見えない。それが心地よい。すべてを理解しなくても、ただそこに居ることが許される本。",
  },
  {
    id: "3",
    label: "5日前",
    excerpt:
      "最初の一文で呼吸が変わった。久しぶりに、読み終わるのが惜しいと思える一冊に出会えた。",
  },
];

function logGap(hoursAgo1: number, hoursAgo2: number): number {
  const diff = Math.abs(hoursAgo2 - hoursAgo1);
  return Math.max(32, Math.round(Math.log2(diff + 1) * 40));
}

const hoursMap = [1, 2, 120];

export function ArchiveScreen() {
  return (
    <div className="min-h-full bg-background">
      <div className="px-8 pt-14 pb-4">
        <span className="text-stone-400 font-sans text-xs tracking-widest uppercase">
          Archive
        </span>
      </div>

      <div className="px-4 pb-20">
        {entries.map((entry, i) => (
          <div key={entry.id}>
            {i > 0 && (
              <div
                style={{
                  height: `${logGap(hoursMap[i - 1], hoursMap[i])}px`,
                }}
              />
            )}
            <TimelineEntry label={entry.label} excerpt={entry.excerpt} />
          </div>
        ))}
      </div>
    </div>
  );
}
