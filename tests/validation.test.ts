import { describe, expect, it } from "vitest";
import {
  echoValues,
  formToObject,
  listingSchema,
  marketplaceFilterSchema,
  parseRegistration,
  parseSocialRegistration,
  registerSchema,
} from "@/lib/validation";

const baseRegister = {
  role: "BUYER",
  name: "Amaka Okafor",
  email: "Amaka@Example.com ",
  password: "harvest2026",
  confirmPassword: "harvest2026",
  terms: "on",
};

describe("registerSchema", () => {
  it("accepts a valid buyer and normalises the email", () => {
    const r = registerSchema.safeParse(baseRegister);
    expect(r.success).toBe(true);
    expect(r.success && r.data.email).toBe("amaka@example.com");
  });

  it("rejects weak or mismatched passwords", () => {
    const weak = registerSchema.safeParse({ ...baseRegister, password: "short", confirmPassword: "short" });
    expect(weak.success).toBe(false);
    const mismatch = registerSchema.safeParse({ ...baseRegister, confirmPassword: "harvest2027" });
    expect(mismatch.success).toBe(false);
    expect(!mismatch.success && mismatch.error.flatten().fieldErrors.confirmPassword).toBeTruthy();
  });

  it("requires business details for sellers", () => {
    const r = registerSchema.safeParse({ ...baseRegister, role: "SELLER" });
    expect(r.success).toBe(false);
    const errs = !r.success ? r.error.flatten().fieldErrors : {};
    expect(errs).toHaveProperty("businessName");
    expect(errs).toHaveProperty("city");
    expect(errs).toHaveProperty("state");
  });

  it("reports cross-field errors together with basic field errors", () => {
    const r = parseRegistration({ role: "SELLER", name: "T", email: "bad", password: "abc", confirmPassword: "xyz" });
    expect(r.success).toBe(false);
    const errs = !r.success ? r.fieldErrors : {};
    for (const k of ["name", "email", "password", "confirmPassword", "businessName", "city", "state", "terms"]) {
      expect(errs).toHaveProperty(k);
    }
  });

  it("does not allow self-registration as admin", () => {
    expect(registerSchema.safeParse({ ...baseRegister, role: "ADMIN" }).success).toBe(false);
  });
});

describe("listingSchema", () => {
  const listing = {
    title: "Fresh eggs",
    categoryId: "cat_1",
    description: "Brown eggs collected daily, packed in crates.",
    unit: "crate of 30",
    pricingMode: "FIXED",
    price: "4800",
    quantityAvailable: "100",
    minOrderQty: "10",
    availability: "IN_STOCK",
    city: "Abeokuta",
    state: "Ogun",
    deliveryOptions: ["PICKUP"],
  };

  it("parses a fixed-price listing", () => {
    const r = listingSchema.safeParse(listing);
    expect(r.success && r.data.price).toBe(4800);
  });

  it("stores quote listings with a null price", () => {
    const r = listingSchema.safeParse({ ...listing, pricingMode: "QUOTE", price: "" });
    expect(r.success && r.data.price).toBeNull();
  });

  it("rejects a missing price, unknown state or no delivery option", () => {
    expect(listingSchema.safeParse({ ...listing, price: "" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...listing, state: "Atlantis" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...listing, deliveryOptions: [] }).success).toBe(false);
  });
});

describe("marketplaceFilterSchema", () => {
  it("falls back to safe defaults for junk input", () => {
    const f = marketplaceFilterSchema.parse({ sort: "drop table", page: "-4", state: "Nowhere", minPrice: "abc" });
    expect(f.sort).toBe("newest");
    expect(f.page).toBe(1);
    expect(f.state).toBeUndefined();
    expect(f.minPrice).toBeUndefined();
  });
});

describe("form helpers", () => {
  it("collects checkbox groups into arrays", () => {
    const fd = new FormData();
    fd.append("deliveryOptions", "PICKUP");
    fd.append("deliveryOptions", "DELIVERY");
    fd.append("title", "Yam");
    expect(formToObject(fd, ["deliveryOptions"])).toEqual({ deliveryOptions: ["PICKUP", "DELIVERY"], title: "Yam" });
    expect(formToObject(new FormData(), ["deliveryOptions"])).toEqual({ deliveryOptions: [] });
  });

  it("never echoes passwords or tokens back to the browser", () => {
    expect(echoValues({ email: "a@b.c", password: "x", confirmPassword: "y", currentPassword: "z", token: "t" })).toEqual({ email: "a@b.c" });
  });
});

describe("parseSocialRegistration", () => {
  it("accepts a buyer without name, email or password (they come from Google/Facebook)", () => {
    const r = parseSocialRegistration({ role: "BUYER", terms: "on", password: "", confirmPassword: "" });
    expect(r.success).toBe(true);
  });

  it("still requires seller details and the terms", () => {
    const r = parseSocialRegistration({ role: "SELLER", businessName: "", city: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(r.fieldErrors).sort()).toEqual(["businessName", "city", "state", "terms"]);
  });

  it("rejects roles other than buyer or seller", () => {
    expect(parseSocialRegistration({ role: "ADMIN", terms: "on" }).success).toBe(false);
  });
});
