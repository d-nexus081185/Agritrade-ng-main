import Image from "next/image";
import { UPLOAD_URL_PREFIX } from "@/lib/constants";

/** Bundled sample photos go through Next's image optimiser; seller uploads are served as-is. */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`${alt} (no photo yet)`}
        style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--earth-700)", background: "var(--earth-100)" }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      style={{ objectFit: "cover" }}
      unoptimized={src.startsWith(UPLOAD_URL_PREFIX)}
    />
  );
}
