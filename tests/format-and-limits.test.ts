import { describe, expect, it } from "vitest";
import { deliveryLabel, formatPrice, parseDeliveryOptions, slugify } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/auth/tokens";

describe("formatting", () => {
  it("formats Naira prices and quote-only listings", () => {
    expect(formatPrice(null)).toBe("Request a quote");
    expect(formatPrice(4800)).toMatch(/4,800/);
  });

  it("parses delivery options defensively", () => {
    expect(parseDeliveryOptions("DELIVERY, PICKUP,TELEPORT")).toEqual(["DELIVERY", "PICKUP"]);
    expect(deliveryLabel("")).toBe("Arrange with seller");
  });

  it("builds URL-safe slugs", () => {
    expect(slugify("Fish & Seafood")).toBe("fish-seafood");
    expect(slugify("  Fresh Brown Eggs — Crate of 30 ")).toBe("fresh-brown-eggs-crate-of-30");
  });
});

describe("rateLimit", () => {
  it("blocks after the limit until the window resets", () => {
    const key = `test:${Math.random()}`;
    const t0 = 1_000_000;
    expect(rateLimit(key, 2, 1000, t0).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000, t0 + 1).allowed).toBe(true);
    const blocked = rateLimit(key, 2, 1000, t0 + 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(rateLimit(key, 2, 1000, t0 + 1001).allowed).toBe(true);
  });
});

describe("tokens", () => {
  it("hashes deterministically without exposing the token", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toContain("abc");
    expect(hashToken("abc")).toHaveLength(64);
  });
});
