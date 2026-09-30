"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Collapses the filter form behind a button on small screens; always open on desktop (see CSS). */
export function FilterToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h2 id="filters-heading" style={{ fontSize: "1.05rem", margin: 0, fontFamily: "var(--font-body)" }}>
        <button
          type="button"
          className="filter-toggle"
          aria-expanded={open}
          aria-controls="filter-body"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="row" style={{ gap: 8 }}><Icon name="sliders" /> Filters</span>
          <span className="chev" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .25s" }}>
            <Icon name="chevronDown" />
          </span>
        </button>
      </h2>
      <div id="filter-body" className="filter-body" data-open={open} style={{ marginTop: 16 }}>
        {children}
      </div>
    </>
  );
}
