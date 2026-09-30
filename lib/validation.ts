import { z } from "zod";
import {
  AVAILABILITY,
  DELIVERY_OPTIONS,
  NIGERIAN_STATES,
  REPORT_REASONS,
} from "./constants";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use 128 characters or fewer.")
  .regex(/[a-zA-Z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

const phone = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^\+?[0-9\s-]{7,20}$/.test(v), "Enter a valid phone number.");

const state = z.enum(NIGERIAN_STATES, { errorMap: () => ({ message: "Choose a state." }) });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

/** Cross-field registration rules, kept separate so they can be reported alongside field errors. */
function registrationIssues(v: Record<string, unknown>): { path: string; message: string }[] {
  const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string).trim() : "");
  const issues: { path: string; message: string }[] = [];
  if (typeof v.password === "string" && v.password !== v.confirmPassword) {
    issues.push({ path: "confirmPassword", message: "Passwords don't match." });
  }
  if (v.role === "SELLER") {
    if (str("businessName").length < 2) issues.push({ path: "businessName", message: "Enter your business or farm name." });
    if (!str("city")) issues.push({ path: "city", message: "Enter the city you sell from." });
    if (!(NIGERIAN_STATES as readonly string[]).includes(str("state"))) issues.push({ path: "state", message: "Choose a state." });
  }
  return issues;
}

export const registerSchema = z
  .object({
    role: z.enum(["BUYER", "SELLER"], { errorMap: () => ({ message: "Choose how you'll use AgriTrade." }) }),
    name: z.string().trim().min(2, "Enter your full name.").max(80),
    email,
    phone,
    password: passwordSchema,
    confirmPassword: z.string(),
    businessName: optionalText(100),
    city: optionalText(60),
    state: z.string().optional(),
    terms: z.literal("on", { errorMap: () => ({ message: "Please accept the terms to continue." }) }),
  })
  .superRefine((v, ctx) => {
    for (const i of registrationIssues(v)) ctx.addIssue({ code: "custom", path: [i.path], message: i.message });
  });

/**
 * Validates a registration form. Unlike `registerSchema.safeParse`, cross-field errors (password
 * mismatch, seller details) are reported together with field errors instead of only afterwards.
 */
export function parseRegistration(raw: Record<string, unknown>) {
  const result = registerSchema.safeParse(raw);
  if (result.success) return result;
  const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
  for (const i of registrationIssues(raw)) fieldErrors[i.path] ??= [i.message];
  return { success: false as const, fieldErrors };
}

/** Sign-up through Google/Facebook: name and email come from the provider, so no password is needed. */
export const socialSignupSchema = z
  .object({
    role: z.enum(["BUYER", "SELLER"], { errorMap: () => ({ message: "Choose how you'll use AgriTrade." }) }),
    phone,
    businessName: optionalText(100),
    city: optionalText(60),
    state: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    for (const i of registrationIssues(v)) ctx.addIssue({ code: "custom", path: [i.path], message: i.message });
  });
export type SocialSignup = z.infer<typeof socialSignupSchema>;

/** Validates the sign-up form when the user picked "Continue with Google/Facebook". */
export function parseSocialRegistration(raw: Record<string, unknown>) {
  const result = socialSignupSchema.safeParse(raw);
  const fieldErrors = result.success ? {} : (result.error.flatten().fieldErrors as Record<string, string[] | undefined>);
  for (const i of registrationIssues(raw)) {
    if (i.path !== "confirmPassword") fieldErrors[i.path] ??= [i.message];
  }
  if (raw.terms !== "on") fieldErrors.terms = ["Please accept the terms to continue."];
  if (result.success && Object.keys(fieldErrors).length === 0) return { success: true as const, data: result.data };
  return { success: false as const, fieldErrors };
}

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "This reset link is invalid."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

/** First password for an account created through Google/Facebook. */
export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  phone,
  companyName: optionalText(100),
  city: optionalText(60),
  state: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || (NIGERIAN_STATES as readonly string[]).includes(v), "Choose a state."),
});

const intFromForm = (label: string, min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} is too large.`);

const deliveryOptions = z
  .array(z.enum(DELIVERY_OPTIONS))
  .min(1, "Choose at least one delivery or pickup option.");

export const listingSchema = z
  .object({
    title: z.string().trim().min(3, "Give the listing a clear name.").max(100),
    categoryId: z.string().min(1, "Choose a category."),
    description: z.string().trim().min(20, "Describe the product in at least 20 characters.").max(2000),
    unit: z.string().trim().min(1, "Enter the unit of sale, e.g. “crate of 30”.").max(40),
    pricingMode: z.enum(["FIXED", "QUOTE"]),
    price: z.string().optional(),
    quantityAvailable: intFromForm("Quantity available", 0, 10_000_000),
    minOrderQty: intFromForm("Minimum order", 1, 1_000_000),
    availability: z.enum(AVAILABILITY),
    city: z.string().trim().min(2, "Enter the city the stock is in.").max(60),
    state,
    deliveryOptions,
  })
  .transform((v, ctx) => {
    let price: number | null = null;
    if (v.pricingMode === "FIXED") {
      const n = Number(v.price);
      if (!v.price || !Number.isInteger(n) || n < 1 || n > 100_000_000) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a whole-Naira price above 0, or choose “Request a quote”." });
        return z.NEVER;
      }
      price = n;
    }
    return { ...v, price };
  });

export const sellerProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name.").max(100),
  description: z.string().trim().max(1500).default(""),
  city: z.string().trim().min(2, "Enter your city.").max(60),
  state,
  phone,
  deliveryOptions,
  yearsInBusiness: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 100), "Enter a number of years between 0 and 100."),
});

export const inquirySchema = z.object({
  productId: z.string().min(1),
  quantity: intFromForm("Quantity", 1, 10_000_000),
  deliveryPreference: z.enum(DELIVERY_OPTIONS),
  message: z.string().trim().min(10, "Tell the seller a little more (at least 10 characters).").max(2000),
});

export const messageSchema = z.object({
  inquiryId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(2000),
});

export const reportSchema = z.object({
  productId: z.string().min(1),
  reason: z.enum(REPORT_REASONS, { errorMap: () => ({ message: "Choose a reason." }) }),
  details: z.string().trim().max(1000).default(""),
});

/** Seller's payment request (escrow order) issued from an inquiry. */
export const offerSchema = z.object({
  inquiryId: z.string().min(1),
  quantity: intFromForm("Quantity", 1, 10_000_000),
  unitPrice: intFromForm("Unit price", 1, 100_000_000),
  deliveryFee: z
    .string()
    .optional()
    .transform((v) => (v ? v : "0"))
    .pipe(intFromForm("Delivery fee", 0, 10_000_000)),
  deliveryMethod: z.enum(DELIVERY_OPTIONS, { errorMap: () => ({ message: "Choose delivery or pickup." }) }),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").default(""),
});

export const disputeSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(10, "Explain what went wrong (at least 10 characters).").max(1000),
});

export const payoutDetailsSchema = z.object({
  payoutBankName: z.string().trim().min(2, "Enter your bank's name.").max(60),
  payoutAccountNumber: z.string().trim().regex(/^\d{10}$/, "Enter your 10-digit NUBAN account number."),
  payoutAccountName: z.string().trim().min(3, "Enter the name on the account.").max(100),
});

export const payoutRecordSchema = z.object({
  orderId: z.string().min(1),
  payoutRef: z.string().trim().min(4, "Enter the bank transfer reference.").max(100),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(50),
  description: z.string().trim().max(300).default(""),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || v.startsWith("/"), "Use a site-relative image path such as /images/eggs-crate.jpg."),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const marketplaceFilterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(60).optional().catch(undefined),
  state: z.enum(NIGERIAN_STATES).optional().catch(undefined),
  availability: z.enum(AVAILABILITY).optional().catch(undefined),
  minPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  maxPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  sort: z.enum(["newest", "price-asc", "price-desc"]).catch("newest").default("newest"),
  page: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
});
export type MarketplaceFilters = z.infer<typeof marketplaceFilterSchema>;

/** Shape returned by every form server action. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Development-only data (e.g. a password reset link when no email service is configured). */
  devLink?: string;
  /** Submitted values echoed back so fields keep their input after React resets the form. */
  values?: Record<string, unknown>;
};

/** Drops secrets before values are sent back to the browser. */
export function echoValues(raw?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !/password|token/i.test(k)));
}

export function fieldErrorsOf(error: z.ZodError, raw?: Record<string, unknown>): ActionState {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
    values: echoValues(raw),
  };
}

/** Error state for a single field, keeping the submitted values. */
export function fieldError(field: string, message: string, raw?: Record<string, unknown>): ActionState {
  return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: { [field]: [message] }, values: echoValues(raw) };
}

/** Reads a FormData into a plain object; repeated keys (checkbox groups) become arrays. */
export function formToObject(formData: FormData, arrayKeys: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (typeof value !== "string") continue;
    if (arrayKeys.includes(key)) {
      const list = (out[key] as string[] | undefined) ?? [];
      list.push(value);
      out[key] = list;
    } else {
      out[key] = value;
    }
  }
  for (const k of arrayKeys) out[k] ??= [];
  return out;
}
