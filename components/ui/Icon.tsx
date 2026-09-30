// Inline stroke icons (24×24 grid) so the app ships no icon font or extra dependency.
const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  store: <><path d="M4 10v10h16V10" /><path d="M3 10 5 4h14l2 6c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3s-3-1.3-3-3Z" /><path d="M10 20v-5h4v5" /></>,
  package: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  truck: <><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  heart: <path d="M12 20s-7.5-4.6-9.3-9.2C1.6 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.4 3.3 4.3 6.3C19.5 15.4 12 20 12 20Z" />,
  leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19c3-4 6-6.5 10-8.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><path d="M12 16.5h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.5h.01" /></>,
  x: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.8c1.7.7 3 2.5 3.5 5.2" /></>,
  basket: <><path d="M3 10h18l-2 10H5L3 10Z" /><path d="m8 10 3-6" /><path d="m16 10-3-6" /><path d="M9 14v3" /><path d="M15 14v3" /></>,
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h10" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  scale: <><path d="M12 4v16" /><path d="M5 20h14" /><path d="M4 8h16" /><path d="m7 8-3 6h6L7 8Z" /><path d="m17 8-3 6h6l-3-6Z" /></>,
  phone: <path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a3 3 0 0 1-3 3C10 21 3 14 3 6a3 3 0 0 1 3-3Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  sliders: <><path d="M4 6h10" /><path d="M18 6h2" /><circle cx="16" cy="6" r="2" /><path d="M4 12h4" /><path d="M12 12h8" /><circle cx="10" cy="12" r="2" /><path d="M4 18h12" /><circle cx="18" cy="18" r="2" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  wallet: <><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4V7Z" /><path d="M4 7V6a2 2 0 0 1 2-2h10v3" /><path d="M16 13.5h.01" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6" /><path d="M9 12h6" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" /><circle cx="12" cy="13" r="3.5" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  filled = false,
  className,
  label,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  className?: string;
  /** Provide for icons that carry meaning on their own; omit for decorative icons. */
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
