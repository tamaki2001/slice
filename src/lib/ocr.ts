export function captureFrameAsBase64(
  video: HTMLVideoElement
): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
}
