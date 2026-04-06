import Tesseract from "tesseract.js";

export async function extractTextFromImage(
  imageData: string
): Promise<string> {
  const {
    data: { text },
  } = await Tesseract.recognize(imageData, "jpn+eng", {
    logger: () => {},
  });

  // 空白・改行を正規化して返す
  return text.replace(/\s+/g, " ").trim();
}

export function captureFrameAsBase64(
  video: HTMLVideoElement
): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);
  // JPEG base64（data:prefix無し）
  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
}
