import { SproutLoader } from "./Sprout";

/**
 * Loading state for dashboard pages. Lives *inside* each role layout so the role check in the
 * layout finishes before streaming starts (redirects stay real HTTP redirects).
 */
export function DashboardLoading() {
  return (
    <>
      <div className="route-progress" aria-hidden="true" />
      <div aria-hidden="true" className="stats">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 104, borderRadius: 14 }} />)}
      </div>
      <SproutLoader label="Loading your dashboard…" />
    </>
  );
}
