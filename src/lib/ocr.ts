const MAX_SIDE = 1024;

export function captureFrameAsBase64(
  video: HTMLVideoElement
): string {
  const w = video.videoWidth || video.clientWidth || 640;
  const h = video.videoHeight || video.clientHeight || 480;
  return resizeToBase64(w, h, (canvas, ctx) => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  });
}

export function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const b64 = resizeToBase64(img.naturalWidth, img.naturalHeight, (canvas, ctx) => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      });
      URL.revokeObjectURL(img.src);
      resolve(b64);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function resizeToBase64(
  origW: number,
  origH: number,
  draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void
): string {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, MAX_SIDE / Math.max(origW, origH));
  canvas.width = Math.round(origW * scale);
  canvas.height = Math.round(origH * scale);
  const ctx = canvas.getContext("2d")!;
  draw(canvas, ctx);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}
