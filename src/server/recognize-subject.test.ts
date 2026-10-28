import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { UsageLimit } from "void/limits";
import { recognizeSubject } from "./recognize-subject";

const request = vi.fn<typeof fetch>();
const input = { targetName: "coffee mug", imageBase64: "YQ==" };
const options = {
  accountId: "test-account",
  gatewayId: "test-gateway",
  apiToken: "test-token",
  signal: new AbortController().signal,
};
const answer = (noul: unknown) =>
  Response.json({
    success: true,
    result: { model: "clef-flash", answers: { matchesTarget: { type: "noul", noul } } },
  });

beforeEach(() => {
  request.mockReset();
  vi.stubGlobal("fetch", request);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("main-subject evaluation", () => {
  it.each([
    [0, false],
    [0.49, false],
    [0.5, true],
    [1, true],
  ])("maps %s to %s", async (noul, matches) => {
    request.mockResolvedValue(answer(noul));
    expect(await recognizeSubject(input, options)).toEqual({
      targetName: input.targetName,
      matches,
    });
  });
  it.each([undefined, null, -0.1, 1.1, "0.8", NaN])(
    "rejects invalid probability %s",
    async (noul) => {
      request.mockResolvedValue(answer(noul));
      await expect(recognizeSubject(input, options)).rejects.toThrow();
    },
  );
  it("preserves transport failures instead of inventing a negative result", async () => {
    const failure = new Error("provider unavailable");
    request.mockRejectedValue(failure);
    await expect(recognizeSubject(input, options)).rejects.toBe(failure);
  });
  it("uses the shared Cloudflare configuration and private single-attempt request", async () => {
    request.mockResolvedValue(answer(0.9));
    await recognizeSubject(input, options);
    expect(request).toHaveBeenCalledOnce();
    const [url, settings] = request.mock.calls[0];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/test-account/ai/run/@cf/cloudflare/clef-flash",
    );
    expect(settings).toMatchObject({
      signal: options.signal,
      headers: {
        Authorization: "Bearer test-token",
        "cf-aig-gateway-id": "test-gateway",
        "cf-aig-collect-log": "false",
        "cf-aig-skip-cache": "true",
        "cf-aig-max-attempts": "1",
      },
    });
    if (typeof settings?.body !== "string") throw new Error("Expected a JSON request body");
    const payload = JSON.parse(settings.body) as {
      model: string;
      state: { targetName: string };
      images: { content_type: string; base64: string }[];
    };
    expect(payload.model).toBe("clef-flash");
    expect(payload.state.targetName).toBe("coffee mug");
    expect(payload.images).toEqual([{ content_type: "image/jpeg", base64: "YQ==" }]);
  });
  it("maps provider limits to the native framework limit", async () => {
    request.mockResolvedValue(new Response("private upstream detail", { status: 429 }));
    await expect(recognizeSubject(input, options)).rejects.toBeInstanceOf(UsageLimit);
  });
  it("rejects a failed provider envelope", async () => {
    request.mockResolvedValue(Response.json({ success: false, result: { answers: {} } }));
    await expect(recognizeSubject(input, options)).rejects.toThrow();
  });
});
