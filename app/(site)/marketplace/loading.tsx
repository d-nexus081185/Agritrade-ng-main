import { SproutLoader } from "@/components/ui/Sprout";

export default function Loading() {
  return (
    <>
      <div className="route-progress" aria-hidden="true" />
      <SproutLoader label="Loading fresh listings…" />
    </>
  );
}
