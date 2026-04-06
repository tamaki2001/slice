import type { Book, Slice } from "./types";

export const mockBook: Book = {
  id: "1",
  title: "菜食主義者",
  subtitle: "채식주의자",
  author: "ハン・ガン",
  translator: "きむ ふな",
  coverUrl: "/book-cover-sample.jpg",
  synopsis:
    "ある日突然、肉食を拒否し始めた妻。その静かな、しかし強烈な拒絶は、やがて家族の日常を崩壊させていく。身体の自律と社会の暴力を問う、アジア圏初のブッカー国際賞受賞作。",
  tags: ["読了", "韓国文学", "ブッカー賞"],
};

export const mockSlices: Slice[] = [
  {
    id: "s1",
    bookId: "1",
    type: "quote",
    body: "「私は信じていた。人間なら誰でも、心の奥底に狂気を飼っているのだと」",
    reference: "p.42",
    createdAt: "2026-04-07T10:30:00",
  },
  {
    id: "s2",
    bookId: "1",
    type: "reflection",
    quoteId: "s1",
    body: "「拒絶」という行為が、これほど静かに暴力的でありうるとは。ヨンヘの肉食拒否は単なる食の選択ではなく、社会が個人に課すあらゆる規範への無言の反乱だった。自分の中にもある「従っているだけの習慣」について考えさせられる。",
    createdAt: "2026-04-07T10:35:00",
  },
  {
    id: "s3",
    bookId: "1",
    type: "reflection",
    quoteId: "s1",
    body: "最近SNSを見る時間が激減した。意識的にやめたのではなく、ただ手が伸びなくなった。ヨンヘの拒絶と同じで、身体が先に判断を下していた。",
    createdAt: "2026-04-07T10:40:00",
  },
  {
    id: "s4",
    bookId: "1",
    type: "quote",
    body: "「あの夢を見てから、私の体はもう、肉を受け付けなくなったの」",
    reference: "p.18",
    createdAt: "2026-04-07T11:00:00",
  },
  {
    id: "s5",
    bookId: "1",
    type: "reflection",
    quoteId: "s4",
    body: "第2部に入り、視点が夫から義兄へと移ることで、ヨンヘの「変容」が他者の欲望のフィルターを通して描かれるようになる。読者である自分もまた、ヨンヘを「理解しよう」とする行為自体が一種の暴力なのではないかと、不意に怖くなった。",
    createdAt: "2026-04-07T14:20:00",
  },
];
