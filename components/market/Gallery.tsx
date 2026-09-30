"use client";

import { useState } from "react";
import { ProductImage } from "./ProductImage";

export function Gallery({ images, title }: { images: { id: string; url: string; alt: string }[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div className="gallery">
      <div className="main">
        <ProductImage key={current?.id ?? "none"} src={current?.url} alt={current?.alt ?? title} sizes="(max-width: 960px) 100vw, 55vw" priority />
      </div>
      {images.length > 1 && (
        <div className="thumbs" role="group" aria-label="Product photos">
          {images.map((img, i) => (
            <button key={img.id} type="button" aria-pressed={i === active} aria-label={`Show photo ${i + 1} of ${images.length}`} onClick={() => setActive(i)} style={{ position: "relative" }}>
              <ProductImage src={img.url} alt="" sizes="76px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
