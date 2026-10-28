import { useEffect, useRef, useState } from "react";
import { fetch as request, FetchError } from "void/client";
import { maxTargetLength, targetNameSchema, type RecognitionResult } from "~/shared/recognition";
import { captureImage, type CapturedImage } from "./capture-image";
import { useCamera } from "./use-camera";
import "./recognition-screen.css";

type Capture = CapturedImage & { targetName: string };
type CheckState =
  | { phase: "camera" }
  | { phase: "preparing" }
  | { phase: "checking"; capture: Capture }
  | { phase: "result"; capture: Capture; result: RecognitionResult }
  | { phase: "error"; capture?: Capture; message: string; retryable: boolean };

function serviceError(error: unknown) {
  if (error instanceof FetchError) {
    if (error.status === 400 || error.status === 413)
      return {
        message: "This photo couldn't be submitted. Please take another.",
        retryable: false,
      };
    if (error.status === 429)
      return { message: "A little busy right now. Try this photo again shortly.", retryable: true };
    if (error.status === 503)
      return { message: "Recognition isn't available yet. Try again later.", retryable: true };
    if (error.status === 504)
      return { message: "That took too long. Try this photo again.", retryable: true };
  }
  return {
    message: "We couldn't check this photo. Check your connection and try again.",
    retryable: true,
  };
}

export function RecognitionScreen() {
  const [targetName, setTargetName] = useState("hotdog");
  const [state, setState] = useState<CheckState>({ phase: "camera" });
  const camera = useCamera();
  const activeRequest = useRef<AbortController | null>(null);
  const verdictRef = useRef<HTMLHeadingElement>(null);
  const busy = state.phase === "preparing" || state.phase === "checking";
  const capture = "capture" in state ? state.capture : undefined;
  const result = state.phase === "result" ? state.result : undefined;
  const validTarget = targetNameSchema.safeParse(targetName).success;

  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => {
    if (state.phase === "result" || state.phase === "error") verdictRef.current?.focus();
  }, [state.phase]);

  async function checkPhoto(photo: Capture, controller: AbortController) {
    setState({ phase: "checking", capture: photo });
    try {
      const answer = await request("/api/recognitions", {
        method: "POST",
        body: { targetName: photo.targetName, imageBase64: photo.imageBase64 },
        signal: controller.signal,
        timeout: 25_000,
        retry: 0,
      });
      if (!controller.signal.aborted) setState({ phase: "result", capture: photo, result: answer });
    } catch (error) {
      if (!controller.signal.aborted)
        setState({ phase: "error", capture: photo, ...serviceError(error) });
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  async function takePhoto() {
    const name = targetNameSchema.safeParse(targetName);
    const video = camera.videoRef.current;
    if (activeRequest.current || !name.success || !video || camera.status !== "ready") return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ phase: "preparing" });
    try {
      const pendingPhoto = captureImage(video);
      camera.stop();
      const photo = await pendingPhoto;
      if (!controller.signal.aborted)
        await checkPhoto({ ...photo, targetName: name.data }, controller);
    } catch (error) {
      if (!controller.signal.aborted)
        setState({
          phase: "error",
          message:
            error instanceof Error ? error.message : "The photo couldn't be captured. Try again.",
          retryable: false,
        });
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  function retry() {
    if (!capture || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    void checkPhoto(capture, controller);
  }

  function retake() {
    setState({ phase: "camera" });
    void camera.start();
  }

  return (
    <main className="camera-app">
      <section className="viewfinder" aria-label="Camera and captured photo" aria-busy={busy}>
        <video
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          className={capture ? "camera-video is-hidden" : "camera-video"}
          aria-label="Live camera preview"
          aria-hidden={camera.status !== "ready" || !!capture}
        />
        {capture && (
          <img
            className="captured-image"
            src={capture.previewUrl}
            alt={`Photo captured for ${capture.targetName}`}
          />
        )}
        {!capture && (
          <div className="frame-guide" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        )}
        {!capture && camera.status !== "ready" && (
          <div className="camera-placeholder">
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M17 13l3-5h8l3 5h7a4 4 0 014 4v20a4 4 0 01-4 4H10a4 4 0 01-4-4V17a4 4 0 014-4h7z" />
              <circle cx="24" cy="26" r="9" />
            </svg>
            <p>{camera.status === "starting" ? "Opening camera…" : "Your camera. One question."}</p>
          </div>
        )}
        <div className="camera-shade" aria-hidden="true" />
      </section>

      <header className="camera-header">
        <a className="wordmark" href="/" aria-label="Hotdog or Not home">
          hotdog or not<span>.</span>
        </a>
        <details className="photo-info">
          <summary aria-label="About your photos">i</summary>
          <p>
            Photos and object names are sent to Cloudflare to check the subject. This app keeps only
            the current photo in memory and saves no history. Provider processing policies apply.
            Recognition is experimental and can be wrong.
          </p>
        </details>
      </header>

      <div className="target-control">
        <label htmlFor="target-name">Looking for</label>
        <div className="target-input-wrap">
          <input
            id="target-name"
            name="targetName"
            value={targetName}
            onChange={(event) => setTargetName(event.target.value)}
            maxLength={maxTargetLength}
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="target-hint"
            aria-invalid={!validTarget}
          />
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 5l5 5M4 20l5-1L20 8a2 2 0 00-4-4L5 15l-1 5z" />
          </svg>
        </div>
        <span id="target-hint" className="visually-hidden">
          Change this name to identify another object.
        </span>
      </div>

      <div className="camera-controls">
        <div className="status-area" aria-live="polite" aria-atomic="true">
          {state.phase === "result" ? (
            <h1
              ref={verdictRef}
              tabIndex={-1}
              className={`verdict ${result?.matches ? "is-match" : "is-not-match"}`}
            >
              <span className="verdict-symbol" aria-hidden="true">
                {result?.matches ? "✓" : "×"}
              </span>
              {result?.matches ? result.targetName : `Not ${result?.targetName}`}
            </h1>
          ) : state.phase === "error" ? (
            <>
              <h1 ref={verdictRef} tabIndex={-1} className="error-title">
                No answer yet.
              </h1>
              <p className="error-message">{state.message}</p>
            </>
          ) : busy ? (
            <p className="capture-hint">
              {state.phase === "preparing" ? "Capturing…" : `Checking ${capture?.targetName}…`}
            </p>
          ) : camera.status === "error" ? (
            <p className="error-message" role="alert">
              {camera.message}
            </p>
          ) : (
            <p className="capture-hint">
              {camera.status === "ready"
                ? "Fill the frame. Take a photo."
                : "Name it above. Find it below."}
            </p>
          )}
        </div>

        {busy ? (
          <button className="shutter is-checking" disabled aria-label="Checking photo">
            <span />
          </button>
        ) : state.phase === "result" || state.phase === "error" ? (
          <div className="result-actions">
            {state.phase === "error" && state.retryable && capture && (
              <button className="retry-button" onClick={retry}>
                Try this photo again
              </button>
            )}
            <button className="retake-button" onClick={retake}>
              <span aria-hidden="true">↻</span> Take another photo
            </button>
          </div>
        ) : (
          <div className="shutter-control">
            <button
              className="shutter"
              disabled={camera.status === "starting" || (camera.status === "ready" && !validTarget)}
              onClick={() => (camera.status === "ready" ? void takePhoto() : void camera.start())}
              aria-label={
                camera.status === "ready"
                  ? "Take photo"
                  : camera.status === "error"
                    ? "Try camera again"
                    : "Open camera"
              }
            >
              <span />
            </button>
            <span className="shutter-label">
              {camera.status === "ready"
                ? "Take photo"
                : camera.status === "starting"
                  ? "Opening…"
                  : camera.status === "error"
                    ? "Try camera again"
                    : "Open camera"}
            </span>
          </div>
        )}
        {!validTarget && !busy && (
          <p className="input-error">Enter an object name to take a photo.</p>
        )}
        {camera.status !== "ready" && !capture && !busy && (
          <p className="processing-note">Photos are processed by Cloudflare.</p>
        )}
      </div>
    </main>
  );
}
