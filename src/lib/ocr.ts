export function captureFrameAsBase64(
  video: HTMLVideoElement
): string {
  const canvas = document.createElement("canvas");
  // モバイルでvideoWidth=0のケースに備えてフォールバック
  const w = video.videoWidth || video.clientWidth || 640;
  const h = video.videoHeight || video.clientHeight || 480;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
}
