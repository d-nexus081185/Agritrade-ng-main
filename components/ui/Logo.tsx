import Link from "next/link";

/** The AgriTrade seedling mark on its own, reused by the header logo and the preloader. */
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <circle className="mark-disc" cx="16" cy="16" r="15" fill="#1f4d33" />
      <path className="mark-stem" d="M16 25V14" stroke="#f6ebdc" strokeWidth="2" strokeLinecap="round" />
      <path className="leaf leaf-l" d="M15.5 18c-4.5 0-7-2.8-7.3-6.6 4.3 0 7 2.4 7.3 6.6Z" fill="#8cc152" />
      <path className="leaf leaf-r" d="M16.5 15.5c.3-4.6 3.3-7.3 7.5-7.3-.2 4.4-3.2 7.2-7.5 7.3Z" fill="#f2b544" />
      <path className="mark-soil" d="M9 25h14" stroke="#c07a3a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/marketplace" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="AgriTrade home">
      <LogoMark />
      <span>AgriTrade</span>
    </Link>
  );
}
