"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

const MIN_VISIBLE_MS = 900;
const FADE_MS = 450;

/**
 * Full-screen brand preloader shown on the first (hard) page load. It is server-rendered so it
 * appears before any JavaScript runs, and a CSS fallback hides it even if hydration never happens.
 * Client-side navigations don't remount the root layout, so it isn't shown again while browsing.
 */
export function Preloader() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  useEffect(() => {
    const started = performance.now();
    let fadeTimer: number | undefined;
    let hideTimer: number | undefined;
    const finish = () => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      fadeTimer = window.setTimeout(() => {
        setPhase("leaving");
        hideTimer = window.setTimeout(() => setPhase("gone"), FADE_MS);
      }, wait);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`preloader ${phase === "leaving" ? "is-leaving" : ""}`} role="status" aria-live="polite" aria-label="Loading AgriTrade">
      <div className="preloader-inner">
        <LogoMark size={96} className="preloader-mark" />
        <span className="preloader-word" aria-hidden="true">AgriTrade</span>
        <span className="preloader-bar" aria-hidden="true" />
      </div>
    </div>
  );
}
