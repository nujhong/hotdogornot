import { maxImageBytes, maxImageEdge, minImageEdge } from "~/shared/recognition";

export type CapturedImage = { imageBase64: string; previewUrl: string };

/** Capture the intrinsic frame so the submitted image matches the uncropped preview. */
export async function captureImage(video: HTMLVideoElement): Promise<CapturedImage> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height || video.readyState < 2)
    throw new Error("The camera isn't ready. Try again.");
  const scale = Math.min(1, maxImageEdge / Math.max(width, height));
  const drawWidth = Math.max(1, Math.round(width * scale));
  const drawHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(minImageEdge, drawWidth);
  canvas.height = Math.max(minImageEdge, drawHeight);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser couldn't capture a photo.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    video,
    (canvas.width - drawWidth) / 2,
    (canvas.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (image) =>
        image ? resolve(image) : reject(new Error("The photo couldn't be captured. Try again.")),
      "image/jpeg",
      0.85,
    );
  });
  if (blob.size > maxImageBytes) throw new Error("The photo is too large. Take another photo.");
  const previewUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("The photo couldn't be read."));
    reader.onerror = () => reject(new Error("The photo couldn't be read."));
    reader.readAsDataURL(blob);
  });
  return { previewUrl, imageBase64: previewUrl.slice(previewUrl.indexOf(",") + 1) };
}
