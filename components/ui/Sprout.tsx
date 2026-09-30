/** The sprouting-seedling motif used for loaders, empty states and success moments. */
export function Sprout({ looping = false, className = "" }: { looping?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`sprout ${looping ? "looping" : ""} ${className}`} aria-hidden="true" focusable="false">
      <ellipse className="soil" cx="32" cy="54" rx="20" ry="4.5" fill="#c07a3a" opacity="0.35" />
      <path className="stem" d="M32 54 C32 44 31 36 32 26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path className="leaf-l" d="M31 34 C22 34 16 28 15 20 C24 20 30 25 31 34 Z" fill="currentColor" opacity="0.85" />
      <path className="leaf-r" d="M33 28 C34 18 41 12 50 12 C49 22 42 28 33 28 Z" fill="#8cc152" />
    </svg>
  );
}

export function SproutLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <Sprout looping />
      <span>{label}</span>
    </div>
  );
}
