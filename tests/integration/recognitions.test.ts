import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Hono } from "hono";
import type { CloudEnv } from "void";
import { convertReturnValue } from "void/response";
import bodyLimit from "~/middleware/recognition-body-limit";
import { POST } from "~/routes/api/recognitions";
import { maxBodyBytes } from "~/shared/recognition";

const request = vi.fn<typeof fetch>();
const { config } = vi.hoisted(() => ({
  config: {
    CLOUDFLARE_ACCOUNT_ID: "test-account",
    CLOUDFLARE_AI_GATEWAY_ID: "test-gateway",
    CLOUDFLARE_AI_GATEWAY_TOKEN: "test-token",
  },
}));
vi.mock("void/env", () => ({ env: config }));
const app = new Hono<CloudEnv>()
  .use("*", bodyLimit)
  .post("/api/recognitions", async (c) => convertReturnValue(await POST(c)));
const answer = (noul: number) =>
  Response.json({
    success: true,
    result: { state: "Completed", result: { answers: { matchesTarget: { type: "noul", noul } } } },
  });
const input = { targetName: "  mug  ", imageBase64: "YQ==" };
const submit = (body: unknown = input) =>
  app.request("/api/recognitions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  config.CLOUDFLARE_AI_GATEWAY_ID = "test-gateway";
  request.mockReset().mockResolvedValue(answer(0.9));
  vi.stubGlobal("fetch", request);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/recognitions", () => {
  it.each([
    [0.9, true],
    [0.1, false],
  ])("returns a binary result for %s", async (noul, matches) => {
    request.mockResolvedValue(answer(noul));
    const response = await submit();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ targetName: "mug", matches });
  });
  it("rejects malformed JSON and blank names before inference", async () => {
    expect(
      (
        await app.request("/api/recognitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        })
      ).status,
    ).toBe(400);
    expect((await submit({ ...input, targetName: " " })).status).toBe(400);
    expect(request).not.toHaveBeenCalled();
  });
  it.each([true, false])("rejects oversized bodies (Content-Length: %s)", async (withLength) => {
    const body = "x".repeat(maxBodyBytes + 1);
    const headers = new Headers({ "Content-Type": "application/json" });
    if (withLength) headers.set("Content-Length", String(body.length));
    const response = await app.request("/api/recognitions", { method: "POST", headers, body });
    expect(response.status).toBe(413);
    expect(request).not.toHaveBeenCalled();
  });
  it("reports missing configuration without a verdict", async () => {
    config.CLOUDFLARE_AI_GATEWAY_ID = "";
    const response = await submit();
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("matches");
    expect(request).not.toHaveBeenCalled();
  });
  it("preserves the native rate-limit response", async () => {
    request.mockResolvedValue(new Response(null, { status: 429 }));
    const response = await submit();
    expect(response.status).toBe(429);
    expect(await response.json()).not.toHaveProperty("matches");
  });
  it("reports a provider deadline instead of a negative classification", async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    request.mockImplementation(async () => {
      controller.abort();
      throw new Error("timed out");
    });
    const response = await submit();
    expect(response.status).toBe(504);
    expect(await response.json()).not.toHaveProperty("matches");
  });
  it.each(["failure", "invalid answer"])("keeps %s private", async (kind) => {
    if (kind === "failure")
      request.mockResolvedValue(new Response("secret upstream payload", { status: 500 }));
    else
      request.mockResolvedValue(
        Response.json({ success: true, result: { state: "Completed", result: { answers: {} } } }),
      );
    const response = await submit();
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).not.toContain("matches");
    expect(body).not.toContain("secret");
  });
});
