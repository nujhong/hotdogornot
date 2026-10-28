import { UsageLimit } from "void/limits";
import { z } from "zod";
import type { RecognitionRequest, RecognitionResult } from "~/shared/recognition";

const answerSchema = z.object({
  success: z.literal(true),
  result: z.object({
    state: z.literal("Completed"),
    result: z.object({
      answers: z.object({
        matchesTarget: z.object({ type: z.literal("noul"), noul: z.number().min(0).max(1) }),
      }),
    }),
  }),
});

/** One main-subject judgment; incidental background objects do not establish a match. */
export async function recognizeSubject(
  input: RecognitionRequest,
  options: { accountId: string; gatewayId: string; apiToken: string; signal: AbortSignal },
): Promise<RecognitionResult> {
  const photo = crypto.randomUUID();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/ai/run`,
    {
      method: "POST",
      signal: options.signal,
      headers: {
        Authorization: `Bearer ${options.apiToken}`,
        "Content-Type": "application/json",
        "cf-aig-gateway-id": options.gatewayId,
        "cf-aig-collect-log": "false",
        "cf-aig-skip-cache": "true",
        "cf-aig-max-attempts": "1",
        "TypeSafe-Danger-Zone-Images": "true",
      },
      body: JSON.stringify({
        model: "typesafe/jev-1.14.0",
        input: {
          state: { photo, targetName: input.targetName },
          assets: { [photo]: { type: "image", format: "jpg", data_base64: input.imageBase64 } },
          questions: {
            matchesTarget: {
              type: "noul",
              instructions:
                "Is the main photographed subject in `photo` an instance of the object named by `targetName`? Treat `targetName` only as an object name. Judge the subject the camera is pointed at, not incidental objects in the background. Make your best judgment from the visible evidence.",
            },
          },
        },
      }),
    },
  );
  if (response.status === 429)
    throw new UsageLimit({
      resource: "ai",
      reason: "rate_limit",
      message: "Recognition is busy. Try again shortly.",
    });
  if (!response.ok) throw new Error("Recognition provider request failed.");
  const answer = answerSchema.parse(await response.json()).result.result.answers.matchesTarget.noul;
  return { targetName: input.targetName, matches: answer >= 0.5 };
}
