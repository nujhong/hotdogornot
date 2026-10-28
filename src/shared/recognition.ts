import { z } from "zod";

export const maxTargetLength = 80;
export const maxImageBytes = 2 * 1024 * 1024;
export const maxBodyBytes = 3 * 1024 * 1024;
export const minImageEdge = 280;
export const maxImageEdge = 1280;

export const targetNameSchema = z
  .string()
  .trim()
  .min(1, "Enter an object name.")
  .max(maxTargetLength, "Use an object name of 80 characters or fewer.");

export const recognitionSchema = z.object({
  targetName: targetNameSchema,
  imageBase64: z
    .base64()
    .min(1)
    .max(4 * Math.ceil(maxImageBytes / 3))
    .refine((value) => {
      const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
      return (value.length / 4) * 3 - padding <= maxImageBytes;
    }, "The photo must be 2 MiB or smaller."),
});

export type RecognitionRequest = z.infer<typeof recognitionSchema>;
export type RecognitionResult = { targetName: string; matches: boolean };
