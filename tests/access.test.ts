import { describe, expect, it } from "vitest";
import { canAccessPath, dashboardPathFor, isProtectedPath, safeRedirectPath } from "@/lib/access";

describe("role-based access", () => {
  it("sends each role to its own dashboard", () => {
    expect(dashboardPathFor("BUYER")).toBe("/buyer");
    expect(dashboardPathFor("SELLER")).toBe("/seller");
    expect(dashboardPathFor("ADMIN")).toBe("/admin");
    expect(dashboardPathFor("SOMETHING_ELSE")).toBe("/marketplace");
  });

  it("keeps roles out of each other's areas", () => {
    expect(canAccessPath("BUYER", "/admin")).toBe(false);
    expect(canAccessPath("BUYER", "/seller/listings")).toBe(false);
    expect(canAccessPath("SELLER", "/admin/users")).toBe(false);
    expect(canAccessPath("SELLER", "/buyer/saved")).toBe(false);
    expect(canAccessPath("ADMIN", "/seller")).toBe(false);
    expect(canAccessPath("ADMIN", "/admin/reports")).toBe(true);
    expect(canAccessPath("BUYER", "/account")).toBe(true);
  });

  it("does not treat look-alike prefixes as protected areas", () => {
    expect(isProtectedPath("/sellers/ogun-valley")).toBe(false);
    expect(canAccessPath("BUYER", "/sellers/ogun-valley")).toBe(true);
    expect(isProtectedPath("/seller")).toBe(true);
    expect(isProtectedPath("/products")).toBe(false);
  });

  it("only allows safe, permitted post-login redirects", () => {
    expect(safeRedirectPath("/products/eggs", "BUYER")).toBe("/products/eggs");
    expect(safeRedirectPath("//evil.example", "BUYER")).toBe("/buyer");
    expect(safeRedirectPath("https://evil.example", "BUYER")).toBe("/buyer");
    expect(safeRedirectPath("/\\evil.example", "BUYER")).toBe("/buyer");
    expect(safeRedirectPath("/admin", "BUYER")).toBe("/buyer");
    expect(safeRedirectPath("/", "SELLER")).toBe("/seller");
    expect(safeRedirectPath(null, "ADMIN")).toBe("/admin");
  });
});
