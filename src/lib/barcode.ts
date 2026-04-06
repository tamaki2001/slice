import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";

let reader: BrowserMultiFormatReader | null = null;

function getReader(): BrowserMultiFormatReader {
  if (!reader) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    reader = new BrowserMultiFormatReader(hints);
  }
  return reader;
}

export function startBarcodeScanner(
  video: HTMLVideoElement,
  onDetect: (isbn: string) => void
): { stop: () => void } {
  let stopped = false;
  let detected = false;
  const r = getReader();

  const scan = async () => {
    if (stopped || detected) return;
    try {
      const result = await r.decodeFromVideoElement(video);
      const text = result.getText().replace(/\D/g, "");

      // ISBN-13 (978/979) またはEAN-13の数字13桁
      if (text.length === 13 && /^97[89]/.test(text)) {
        detected = true;
        onDetect(text);
        return;
      }
    } catch {
      // デコード失敗→再試行
    }
    if (!stopped && !detected) {
      setTimeout(scan, 300);
    }
  };

  scan();

  return {
    stop: () => {
      stopped = true;
    },
  };
}
