import { AVAILABILITY_LABELS, DELIVERY_LABELS, type Availability, type DeliveryOption } from "./constants";

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

export function formatPrice(price: number | null | undefined): string {
  return price == null ? "Request a quote" : naira.format(price);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-NG").format(n);
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function availabilityLabel(a: string): string {
  return AVAILABILITY_LABELS[a as Availability] ?? a;
}

export function parseDeliveryOptions(csv: string): DeliveryOption[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is DeliveryOption => s in DELIVERY_LABELS);
}

export function deliveryLabel(csv: string): string {
  const opts = parseDeliveryOptions(csv);
  return opts.length ? opts.map((o) => DELIVERY_LABELS[o]).join(" · ") : "Arrange with seller";
}

export function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
