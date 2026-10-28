// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fetch as request } from "void/client";
import { captureImage } from "./capture-image";
import { RecognitionScreen } from "./recognition-screen";
import type { RecognitionResult } from "~/shared/recognition";

const camera = vi.hoisted(() => ({
  videoRef: { current: null },
  status: "ready",
  start: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("./use-camera", () => ({ useCamera: () => camera }));
vi.mock("./capture-image", () => ({ captureImage: vi.fn() }));
vi.mock("void/client", async (original) => ({
  ...(await original<typeof import("void/client")>()),
  fetch: vi.fn(),
}));
const api = vi.mocked(request);
const image = { imageBase64: "YQ==", previewUrl: "data:image/jpeg;base64,YQ==" };

beforeEach(() => {
  camera.status = "ready";
  vi.mocked(captureImage).mockReset().mockResolvedValue(image);
  api.mockReset().mockResolvedValue({ targetName: "hotdog", matches: true });
});
afterEach(cleanup);

it("starts with hotdog and waits for camera permission before allowing a photo", () => {
  camera.status = "starting";
  render(<RecognitionScreen />);
  expect(screen.getByLabelText("Looking for")).toHaveProperty("value", "hotdog");
  expect(screen.getByRole("button", { name: "Opening camera" })).toHaveProperty("disabled", true);
  expect(captureImage).not.toHaveBeenCalled();
  expect(api).not.toHaveBeenCalled();
});

it("locks the captured name through a single request and keeps the old verdict after editing", async () => {
  let finish: (result: RecognitionResult) => void = () => {};
  api.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const user = userEvent.setup();
  render(<RecognitionScreen />);
  const input = screen.getByLabelText("Looking for");
  await user.clear(input);
  await user.type(input, "mug");
  await user.click(screen.getByRole("button", { name: /Take photo/ }));
  expect(input).toHaveProperty("disabled", true);
  expect(api).toHaveBeenCalledOnce();
  expect(api).toHaveBeenCalledWith(
    "/api/recognitions",
    expect.objectContaining({ body: { targetName: "mug", imageBase64: "YQ==" }, retry: 0 }),
  );
  await act(async () => finish({ targetName: "mug", matches: false }));
  const verdict = await screen.findByRole("heading", { name: "Not mug" });
  expect(document.activeElement).toBe(verdict);
  await user.clear(input);
  await user.type(input, "laptop");
  expect(screen.getByRole("heading", { name: "Not mug" })).toBeTruthy();
  expect(api).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("button", { name: /Take another photo/ }));
  expect(camera.start).toHaveBeenCalledOnce();
});

it("keeps a failed check separate from a verdict and retries the original capture", async () => {
  api.mockRejectedValueOnce(new Error("offline"));
  const user = userEvent.setup();
  render(<RecognitionScreen />);
  await user.click(screen.getByRole("button", { name: /Take photo/ }));
  expect(await screen.findByRole("heading", { name: "No answer yet." })).toBeTruthy();
  const input = screen.getByLabelText("Looking for");
  await user.clear(input);
  await user.type(input, "mug");
  await user.click(screen.getByRole("button", { name: /Try this photo again/ }));
  expect(await screen.findByRole("heading", { name: "hotdog" })).toBeTruthy();
  expect(api).toHaveBeenLastCalledWith(
    "/api/recognitions",
    expect.objectContaining({ body: { targetName: "hotdog", imageBase64: "YQ==" } }),
  );
  expect(captureImage).toHaveBeenCalledOnce();
});

it("does not submit unusable captures", async () => {
  vi.mocked(captureImage).mockRejectedValueOnce(new Error("Camera isn't ready."));
  const user = userEvent.setup();
  render(<RecognitionScreen />);
  await user.click(screen.getByRole("button", { name: /Take photo/ }));
  await screen.findByRole("heading", { name: "No answer yet." });
  expect(api).not.toHaveBeenCalled();
});
