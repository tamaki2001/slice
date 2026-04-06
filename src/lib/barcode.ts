import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType, HTMLCanvasElementLuminanceSource, BinaryBitmap, HybridBinarizer } from "@zxing/library";

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
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const scan = () => {
    if (stopped || detected) return;

    // videoの準備ができていない場合はリトライ
    if (video.readyState < 2 || video.videoWidth === 0) {
      setTimeout(scan, 500);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const luminance = new HTMLCanvasElementLuminanceSource(canvas);
      const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
      const result = r.decodeBitmap(bitmap);
      const text = result.getText().replace(/\D/g, "");

      console.log("[barcode] 検出:", result.getText(), "→ 数字:", text);

      if (text.length === 13 && /^97[89]/.test(text)) {
        detected = true;
        onDetect(text);
        return;
      }
    } catch {
      // デコード失敗は正常（バーコードがフレーム内にない）
    }

    if (!stopped && !detected) {
      setTimeout(scan, 400);
    }
  };

  // video再生開始を待ってからスキャン開始
  if (video.readyState >= 2) {
    scan();
  } else {
    video.addEventListener("loadeddata", () => scan(), { once: true });
  }

  return {
    stop: () => {
      stopped = true;
    },
  };
}
