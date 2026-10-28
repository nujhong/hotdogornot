// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vite-plus/test";
import { captureImage } from "./capture-image";
import { maxImageBytes } from "~/shared/recognition";

const context = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() };
const toBlob = vi.fn<HTMLCanvasElement["toBlob"]>();

beforeEach(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => context),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
    configurable: true,
    value: toBlob,
  });
  toBlob
    .mockReset()
    .mockImplementation((callback) => callback(new Blob(["image"], { type: "image/jpeg" })));
});

function video(width: number, height: number) {
  const element = document.createElement("video");
  Object.defineProperties(element, {
    videoWidth: { value: width },
    videoHeight: { value: height },
    readyState: { value: 4 },
  });
  return element;
}

it.each([
  [1920, 1080, 1280, 720],
  [1080, 1920, 720, 1280],
  [2000, 100, 1280, 280],
  [120, 90, 280, 280],
])("prepares the full %s×%s frame into %s×%s", async (width, height, outputWidth, outputHeight) => {
  const frame = video(width, height);
  const capture = await captureImage(frame);
  expect(context.fillRect).toHaveBeenCalledWith(0, 0, outputWidth, outputHeight);
  const [, , , drawnWidth, drawnHeight] = context.drawImage.mock.calls[0];
  expect(drawnWidth / drawnHeight).toBeCloseTo(width / height, 1);
  expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.85);
  expect(capture.previewUrl).toBe(`data:image/jpeg;base64,${capture.imageBase64}`);
});

it("rejects a camera with no usable frame", async () => {
  await expect(captureImage(video(0, 0))).rejects.toThrow("isn't ready");
});

it("rejects failed and oversized exports", async () => {
  toBlob.mockImplementationOnce((callback) => callback(null));
  await expect(captureImage(video(640, 480))).rejects.toThrow("couldn't be captured");
  toBlob.mockImplementationOnce((callback) =>
    callback(new Blob([new Uint8Array(maxImageBytes + 1)])),
  );
  await expect(captureImage(video(640, 480))).rejects.toThrow("too large");
});
