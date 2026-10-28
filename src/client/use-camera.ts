import { useCallback, useEffect, useRef, useState } from "react";

type CameraState =
  | { status: "idle" | "starting" | "ready"; message?: never }
  | { status: "error"; message: string };

function cameraMessage(error: unknown) {
  if (error instanceof DOMException || error instanceof Error) {
    if (error.name === "NotAllowedError")
      return "Camera access was denied. Allow it in your browser's site settings, then try again.";
    if (error.name === "NotFoundError")
      return "No camera was found. Connect a camera and try again.";
    if (error.name === "NotReadableError")
      return "The camera is in use. Close other camera apps and try again.";
  }
  return "The camera couldn't start. Check camera access and try again.";
}

/** Own the media stream, including permission requests that finish after cleanup. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const [state, setState] = useState<CameraState>({ status: "idle" });

  const release = useCallback(() => {
    generation.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    release();
    setState({ status: "idle" });
  }, [release]);

  const start = useCallback(async () => {
    release();
    const request = generation.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({
        status: "error",
        message: "Camera access needs HTTPS or localhost in a supported browser.",
      });
      return;
    }
    setState({ status: "starting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (generation.current !== request) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        release();
        return;
      }
      video.srcObject = stream;
      await video.play();
      if (generation.current === request) setState({ status: "ready" });
    } catch (error) {
      if (generation.current !== request) return;
      release();
      setState({ status: "error", message: cameraMessage(error) });
    }
  }, [release]);

  useEffect(() => release, [release]);
  return { videoRef, ...state, start, stop };
}
