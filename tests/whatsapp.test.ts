import { describe, expect, it } from "vitest";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

describe("WhatsApp phone normalization", () => {
  it("normalizes Nigerian local numbers", () => {
    expect(normalizeWhatsAppPhone("0803 123 4567")).toBe("2348031234567");
    expect(normalizeWhatsAppPhone("8031234567")).toBe("2348031234567");
    expect(normalizeWhatsAppPhone("2348031234567")).toBe("2348031234567");
  });

  it("preserves international numbers and rejects unusable values", () => {
    expect(normalizeWhatsAppPhone("+44 7700 900123")).toBe("447700900123");
    expect(normalizeWhatsAppPhone("001 202 555 0123")).toBe("12025550123");
    expect(normalizeWhatsAppPhone("not a phone")).toBeNull();
    expect(normalizeWhatsAppPhone("12345")).toBeNull();
    expect(normalizeWhatsAppPhone(null)).toBeNull();
  });
});