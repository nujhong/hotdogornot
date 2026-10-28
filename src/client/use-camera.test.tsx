// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useCamera } from "./use-camera";

const getUserMedia = vi.fn();
const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] };

function CameraHarness() {
  const camera = useCamera();
  return (
    <>
      <video ref={camera.videoRef} />
      <button onClick={() => void camera.start()}>Start</button>
      <button onClick={camera.stop}>Stop</button>
      <span>{camera.status}</span>
      <p>{camera.message}</p>
    </>
  );
}

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  getUserMedia.mockReset().mockResolvedValue(stream);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});
afterEach(cleanup);

it("requests camera access on mount and releases tracks on stop and unmount", async () => {
  const view = render(<CameraHarness />);
  expect(getUserMedia).toHaveBeenCalledOnce();
  await screen.findByText("ready");
  expect(getUserMedia).toHaveBeenCalledWith({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });
  fireEvent.click(screen.getByText("Stop"));
  expect(stopTrack).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByText("Start"));
  await screen.findByText("ready");
  view.unmount();
  expect(stopTrack).toHaveBeenCalledTimes(2);
});

it("stops a stream granted after the screen unmounts", async () => {
  let grant: (value: typeof stream) => void = () => {};
  getUserMedia.mockReturnValue(
    new Promise((resolve) => {
      grant = resolve;
    }),
  );
  const view = render(<CameraHarness />);
  view.unmount();
  await act(async () => grant(stream));
  expect(stopTrack).toHaveBeenCalledOnce();
});

it("explains denied permission and can recover", async () => {
  getUserMedia.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
  render(<CameraHarness />);
  await screen.findByText(/Camera access was denied/);
  fireEvent.click(screen.getByText("Start"));
  await waitFor(() => expect(screen.getByText("ready")).toBeTruthy());
});
