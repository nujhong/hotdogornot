import { describe, expect, it } from "vite-plus/test";
import { maxImageBytes, recognitionSchema, targetNameSchema } from "./recognition";

describe("recognition input", () => {
  it("trims names while keeping spaces and Unicode", () => {
    expect(targetNameSchema.parse("  茶杯 mug  ")).toBe("茶杯 mug");
    expect(targetNameSchema.safeParse("  ").success).toBe(false);
    expect(targetNameSchema.safeParse("a".repeat(81)).success).toBe(false);
    expect(targetNameSchema.safeParse("a".repeat(80)).success).toBe(true);
  });
  it.each(["", "!bad!", "data:image/jpeg;base64,YQ==", "Y Q=="])(
    "rejects malformed image data %s",
    (imageBase64) => {
      expect(recognitionSchema.safeParse({ targetName: "mug", imageBase64 }).success).toBe(false);
    },
  );
  it("enforces the decoded limit even when encoded lengths share a padding bucket", () => {
    const input = (size: number) => ({
      targetName: "mug",
      imageBase64: Buffer.alloc(size).toString("base64"),
    });
    expect(recognitionSchema.safeParse(input(maxImageBytes)).success).toBe(true);
    expect(recognitionSchema.safeParse(input(maxImageBytes + 1)).success).toBe(false);
  });
});
