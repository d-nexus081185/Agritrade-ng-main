// Downloads the product photography used by AgriTrade from Wikimedia Commons
// and writes attribution data to public/images/credits.json.
// Usage: node scripts/fetch-images.mjs            (the images are already committed; re-run only to refresh)
//        node scripts/fetch-images.mjs name ...   (fetch only these, keeping the other credits)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public", "images");
const UA = "AgriTradeImageFetcher/1.0 (https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)";

/** local file name -> [Commons file title, width] */
const IMAGES = {
  "eggs-crate": ["File:Display of crates of eggs.jpg", 1200],
  "eggs-pallet": ["File:Poultry eggs in crates.jpg", 1200],
  "eggs-sack": ["File:Egg crate on sack.jpg", 1200],
  "live-chickens": ["File:Broiler Chickens 002.jpg", 1200],
  "spent-layers": ["File:Broiler and off layer chickens.jpg", 1200],
  "poultry-house": ["File:Bobby Morgan Poultry Farm Agriculture in the United States.jpg", 1200],
  "turkey": ["File:Domesticated turkey.jpg", 1200],
  "catfish-fresh": ["File:Catfish (live catfish).jpg", 720],
  "catfish-smoked": ["File:Smoked Catfish Badagry Market.jpg", 1000],
  "catfish-smoked-close": ["File:Dry Fish at monday market kaduna state 03.jpg", 1200],
  "catfish-pond": ["File:Catfish (Clarias gariepinus).jpg", 1200],
  "crayfish": ["File:A man selling dried crayfish in african market.jpg", 1200],
  "fish-market": ["File:Nigeria fish1.jpg", 900],
  // Oron (Akwa Ibom) dried seafood
  "dry-fish-akpan-ata": ["File:Dry fish (known as Akpan Ata.in Ibibio community).jpg", 1200],
  "dry-fish-stack": ["File:Picture of a Dried Fish 01.jpg", 1200],
  "dry-fish-split": ["File:Splited dry fish.jpg", 1200],
  "dry-fish-dealer": ["File:Dry fish dealer.jpg", 1200],
  "dry-solefish": ["File:Dry Solefish.jpg", 1200],
  "crayfish-bags": ["File:Bag of crayfish.jpg", 1200],
  "crayfish-tray": ["File:Crayfish for sale at Creek Market.jpg", 1200],
  "prawns-dried": ["File:Dried prawns.jpg", 1200],
  "prawns-fresh": ["File:Fresh sea prawns.jpg", 1200],
  "prawns-tray": ["File:A tray of shrimps.jpg", 1200],
  "yam-market": ["File:Picture of yam tubers at fruit gardem market port harcourt.jpg", 1200],
  "yam-stack": ["File:Yam Tubers stacked on a plastic table 01.jpg", 1200],
  "onions-pile": ["File:Pile of Onions at Barkin Dogo Market, Kaduna North 01.jpg", 1200],
  "onions-sorting": ["File:Sorting Onions (15358524090).jpg", 1200],
  "tomatoes": ["File:Baskets of freshly harvested tomatoes at Pambeguwa perishable market 01.jpg", 1200],
  "plantain": ["File:Plantain Bunches.jpg", 1200],
  "pepper": ["File:Red chilli pepper at ayegbaju market, osogbo.jpg", 1200],
  "garri": ["File:Garri Displayed For Sale After Processing.jpg", 780],
  "rice": ["File:Bags of Abakaliki Rice.jpg", 1008],
  "maize": ["File:Corn cob.jpg", 1200],
  "hero-field": ["File:The Land is Green.jpg", 2000],
  "cassava-farm": ["File:A Massive Cassava Farm.jpg", 1600],
  "farmer": ["File:Farmer Walking Through Farmland.jpg", 1200],
};

/** fetch() that waits and retries when Wikimedia rate-limits us (HTTP 429). */
async function politeFetch(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status !== 429 || attempt === 6) return res;
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

const stripHtml = (s = "") => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const only = process.argv.slice(2);
  const unknown = only.filter((n) => !(n in IMAGES));
  if (unknown.length) throw new Error(`Unknown image name(s): ${unknown.join(", ")}`);
  const creditsFile = path.join(OUT_DIR, "credits.json");
  const credits = only.length ? JSON.parse(await readFile(creditsFile, "utf8")) : {};
  for (const [name, [title, width]] of Object.entries(IMAGES)) {
    if (only.length && !only.includes(name)) continue;
    const api =
      "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo" +
      `&iiprop=url|extmetadata&iiurlwidth=${width}&titles=${encodeURIComponent(title)}`;
    const meta = await (await politeFetch(api)).json();
    const page = Object.values(meta.query.pages)[0];
    const info = page.imageinfo?.[0];
    if (!info) throw new Error(`No image info for ${title}`);
    const src = info.thumburl ?? info.url;
    const res = await politeFetch(src);
    if (!res.ok) throw new Error(`Download failed for ${title}: ${res.status}`);
    await writeFile(path.join(OUT_DIR, `${name}.jpg`), Buffer.from(await res.arrayBuffer()));
    credits[name] = {
      title: title.replace(/^File:/, ""),
      author: stripHtml(info.extmetadata?.Artist?.value) || "Unknown",
      license: info.extmetadata?.LicenseShortName?.value ?? "See source",
      licenseUrl: info.extmetadata?.LicenseUrl?.value ?? null,
      source: info.descriptionurl,
    };
    console.log(`✓ ${name}.jpg  (${credits[name].license}, ${credits[name].author})`);
    await new Promise((r) => setTimeout(r, 1500)); // be polite to the API
  }
  await writeFile(creditsFile, JSON.stringify(credits, null, 2) + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
