import Image from "next/image";
import credits from "@/public/images/credits.json";

export const metadata = { title: "Photo credits" };

type Credit = { title: string; author: string; license: string; licenseUrl: string | null; source: string };

export default function CreditsPage() {
  const entries = Object.entries(credits as Record<string, Credit>);
  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Attribution</p>
          <h1>Photo credits</h1>
          <p className="muted">
            Sample product photography comes from Wikimedia Commons and is used under the licences listed below. Many
            images were taken in Nigerian markets and farms by Commons contributors.
          </p>
        </div>
      </div>
      <ul className="product-grid" style={{ listStyle: "none", padding: 0 }}>
        {entries.map(([file, c]) => (
          <li key={file} className="card" style={{ overflow: "hidden" }}>
            <div style={{ position: "relative", aspectRatio: "4 / 3" }}>
              <Image src={`/images/${file}.jpg`} alt={c.title} fill sizes="300px" style={{ objectFit: "cover" }} />
            </div>
            <div style={{ padding: 14 }} className="small">
              <strong style={{ display: "block" }}>{c.title}</strong>
              <span className="muted">by {c.author} · </span>
              {c.licenseUrl ? <a href={c.licenseUrl} rel="license noopener" target="_blank">{c.license}</a> : c.license}
              {" · "}
              <a href={c.source} rel="noopener" target="_blank">Source</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
