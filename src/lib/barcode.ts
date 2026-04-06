import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

let reader: BrowserMultiFormatReader | null = null;

function getReader(): BrowserMultiFormatReader {
  if (!reader) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
    ]);
    reader = new BrowserMultiFormatReader(hints);
  }
  return reader;
}

export function startBarcodeScanner(
  video: HTMLVideoElement,
  onDetect: (isbn: string) => void
): { stop: () => void } {
  let stopped = false;
  const r = getReader();

  const scan = async () => {
    if (stopped) return;
    try {
      const result = await r.decodeFromVideoElement(video);
      const text = result.getText();
      // ISBN: 978 or 979で始まる13桁
      if (/^97[89]\d{10}$/.test(text)) {
        onDetect(text);
        return;
      }
    } catch {
      // デコード失敗は無視して再試行
    }
    if (!stopped) {
      requestAnimationFrame(scan);
    }
  };

  scan();

  return {
    stop: () => {
      stopped = true;
    },
  };
}
