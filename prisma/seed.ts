/**
 * Seeds AgriTrade with SAMPLE data: categories, demo accounts, listings, inquiries and a report.
 * Every seeded user and product has `isSample = true` and is labelled "Sample" in the UI.
 *
 * Re-running is safe: previously seeded sample users (and everything they own) are removed first.
 * Real accounts and listings created through the app are never touched.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const password = process.env.SEED_DEMO_PASSWORD;
if (!password || password.length < 8) {
  console.error("Set SEED_DEMO_PASSWORD (8+ characters) in .env before seeding. It becomes the password for every demo account.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  console.error("Refusing to seed demo accounts in production. Set ALLOW_PRODUCTION_SEED=true if you really mean it.");
  process.exit(1);
}

const img = (name: string) => `/images/${name}.jpg`;

const CATEGORIES = [
  { name: "Eggs", slug: "eggs", image: "eggs-crate", description: "Table eggs by the crate or pallet, straight from layer farms." },
  { name: "Poultry", slug: "poultry", image: "live-chickens", description: "Live broilers, layers, turkeys and other birds." },
  { name: "Fish & Seafood", slug: "fish-seafood", image: "catfish-smoked", description: "Fresh and smoked catfish, crayfish and sea fish." },
  { name: "Yam & Tubers", slug: "yam-tubers", image: "yam-market", description: "Yam tubers and other root crops in bulk lots." },
  { name: "Onions", slug: "onions", image: "onions-pile", description: "Red and dry onions by the bag or tonne." },
  { name: "Vegetables", slug: "vegetables", image: "tomatoes", description: "Tomatoes, peppers and fresh vegetables." },
  { name: "Grains & Staples", slug: "grains-staples", image: "rice", description: "Rice, garri, maize and other staples." },
  { name: "Fruits", slug: "fruits", image: "plantain", description: "Plantain and fresh fruit from growers." },
];

type SellerSeed = {
  key: string;
  email: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "PENDING";
  business: string;
  slug: string;
  city: string;
  state: string;
  years: number;
  delivery: string;
  description: string;
};

const SELLERS: SellerSeed[] = [
  {
    key: "ogun", email: "seller@agritrade.test", name: "Chidi Nwosu", phone: "+234 803 555 0142", status: "ACTIVE",
    business: "Ogun Valley Poultry Farms", slug: "ogun-valley-poultry-farms", city: "Abeokuta", state: "Ogun", years: 9, delivery: "DELIVERY,PICKUP",
    description: "Family-run layer and broiler farm with 40,000 birds. We supply supermarkets, bakeries and hotels across Ogun and Lagos with weekly egg deliveries.",
  },
  {
    key: "delta", email: "delta.fisheries@agritrade.test", name: "Ese Okoro", phone: "+234 806 555 0199", status: "ACTIVE",
    business: "Delta Fresh Fisheries", slug: "delta-fresh-fisheries", city: "Warri", state: "Delta", years: 6, delivery: "DELIVERY,PICKUP",
    description: "Catfish ponds and a smoking house on the outskirts of Warri. Fresh catfish harvested to order; smoked fish packed in 10 kg cartons.",
  },
  {
    key: "oron", email: "oron.seafoods@agritrade.test", name: "Idongesit Etim", phone: "+234 808 555 0164", status: "ACTIVE",
    business: "Oron Beach Dry Fish & Crayfish", slug: "oron-beach-dry-fish-crayfish", city: "Oron", state: "Akwa Ibom", years: 11, delivery: "PICKUP,DELIVERY",
    description: "Wholesale dry fish, crayfish and prawns from the Oron beach seafood market, sourced from the landing beaches at Oron, Atabong, Enwang and Ibaka. Smoked and sun-dried the traditional way, sorted and bagged for traders across the South-East, South-South and Lagos.",
  },
  {
    key: "benue", email: "benue.yams@agritrade.test", name: "Terver Iorliam", phone: "+234 805 555 0170", status: "ACTIVE",
    business: "Zaki Biam Yam Collective", slug: "zaki-biam-yam-collective", city: "Zaki Biam", state: "Benue", years: 12, delivery: "PICKUP,DELIVERY",
    description: "A collective of 60 yam farmers selling from the Zaki Biam yam market. Truckload delivery available to Abuja, Enugu and Lagos.",
  },
  {
    key: "kano", email: "kano.harvest@agritrade.test", name: "Aisha Bello", phone: "+234 802 555 0111", status: "ACTIVE",
    business: "Kano Harvest Traders", slug: "kano-harvest-traders", city: "Kano", state: "Kano", years: 15, delivery: "DELIVERY",
    description: "Aggregators of onions, tomatoes and peppers from farms around Kano and Kaduna. Bulk bags graded and sorted before dispatch.",
  },
  {
    key: "ebonyi", email: "ebonyi.grains@agritrade.test", name: "Ngozi Eze", phone: "+234 809 555 0133", status: "ACTIVE",
    business: "Abakaliki Grains & Staples", slug: "abakaliki-grains-staples", city: "Abakaliki", state: "Ebonyi", years: 7, delivery: "PICKUP,DELIVERY",
    description: "Destoned Abakaliki rice from local mills, plus plantain and other staples sourced from partner farms in the South-East and Ondo.",
  },
  {
    key: "plateau", email: "plateau.growers@agritrade.test", name: "Danjuma Pam", phone: "+234 807 555 0188", status: "PENDING",
    business: "Plateau Highland Growers", slug: "plateau-highland-growers", city: "Jos", state: "Plateau", years: 3, delivery: "PICKUP",
    description: "New seller awaiting approval — maize and vegetables from the Jos plateau.",
  },
];

type ProductSeed = {
  seller: string;
  category: string;
  title: string;
  slug: string;
  unit: string;
  price: number | null;
  qty: number;
  min: number;
  availability?: string;
  status?: string;
  images: string[];
  description: string;
  city?: string;
  state?: string;
  delivery?: string;
};

const PRODUCTS: ProductSeed[] = [
  {
    seller: "ogun", category: "eggs", title: "Fresh brown eggs — crate of 30", slug: "fresh-brown-eggs-crate-of-30", unit: "crate of 30", price: 4800, qty: 1200, min: 20,
    images: ["eggs-crate", "eggs-sack"],
    description: "Medium-to-large brown table eggs collected daily from our layer houses. Candled and packed in reusable plastic crates.\n\nStandard weekly supply: up to 1,200 crates. Ideal for supermarkets, bakeries and caterers.",
  },
  {
    seller: "ogun", category: "eggs", title: "Farm eggs — pallet of 30 crates", slug: "farm-eggs-pallet-of-30-crates", unit: "pallet (30 crates)", price: null, qty: 40, min: 1, availability: "LIMITED",
    images: ["eggs-pallet"],
    description: "Full pallets for distributors and large retailers. Price depends on weekly volume and delivery distance — send an inquiry with your required quantity for a quote.",
  },
  {
    seller: "ogun", category: "poultry", title: "Live broiler chickens (2.5–3 kg)", slug: "live-broiler-chickens", unit: "bird", price: 9500, qty: 600, min: 50,
    images: ["live-chickens", "poultry-house"],
    description: "Healthy 7–8 week broilers, fully vaccinated, averaging 2.5–3 kg live weight. Pickup from the farm or delivery in ventilated crates within Ogun and Lagos.",
  },
  {
    seller: "ogun", category: "poultry", title: "Live turkeys (mature toms & hens)", slug: "live-turkeys", unit: "bird", price: 45000, qty: 80, min: 5, availability: "PRE_ORDER",
    images: ["turkey"],
    description: "Mature turkeys for festive season orders. Book now for December delivery — a 30% deposit secures your birds.",
  },
  {
    seller: "ogun", category: "poultry", title: "Spent layers (old hens)", slug: "spent-layers-old-hens", unit: "bird", price: 5500, qty: 0, min: 30, availability: "OUT_OF_STOCK",
    images: ["spent-layers"],
    description: "End-of-lay hens, popular with restaurants for pepper soup. Next batch expected in about six weeks.",
  },
  {
    seller: "delta", category: "fish-seafood", title: "Fresh live catfish (1 kg+)", slug: "fresh-live-catfish", unit: "kg", price: 3200, qty: 2000, min: 50,
    images: ["catfish-fresh", "catfish-pond"],
    description: "Pond-raised African catfish, harvested to order and transported live in aerated tanks. Average size 1–1.5 kg.",
  },
  {
    seller: "delta", category: "fish-seafood", title: "Smoked catfish — 10 kg carton", slug: "smoked-catfish-carton", unit: "10 kg carton", price: 38000, qty: 150, min: 5,
    images: ["catfish-smoked", "catfish-smoked-close"],
    description: "Traditionally smoked and dried catfish with a long shelf life. Packed in lined cartons for easy transport and storage.",
  },
  {
    seller: "delta", category: "fish-seafood", title: "Dried crayfish — 25 kg bag", slug: "dried-crayfish-25kg", unit: "25 kg bag", price: 95000, qty: 60, min: 2, availability: "LIMITED",
    images: ["crayfish"],
    description: "Clean, sun-dried crayfish with minimal sand. Ideal for food vendors and spice processors.",
  },
  {
    seller: "delta", category: "fish-seafood", title: "Mixed sea fish — market basket", slug: "mixed-sea-fish-basket", unit: "basket (~20 kg)", price: null, qty: 100, min: 3,
    images: ["fish-market"],
    description: "Assorted fresh sea fish landed at Ibeno and nearby beaches. Mix varies with the catch — ask for today's selection and price.",
    city: "Ibeno", state: "Akwa Ibom",
  },
  {
    seller: "oron", category: "fish-seafood", title: "Akpan Ata smoked dry fish — bundle of 10", slug: "akpan-ata-smoked-dry-fish", unit: "bundle of 10 fish", price: 65000, qty: 120, min: 2,
    images: ["dry-fish-akpan-ata", "dry-fish-stack"],
    description: "Large whole fish smoked hard and curled the Oron way (\"Akpan Ata\" in Ibibio). Well dried for a long shelf life and strong smoky flavour — a favourite for afang, edikang ikong and native soups.\n\nSizes vary with the catch; we sort bundles by size so every fish in a bundle is similar.",
  },
  {
    seller: "oron", category: "fish-seafood", title: "Split smoked dry fish — 10 kg carton", slug: "split-smoked-dry-fish-10kg", unit: "10 kg carton", price: 110000, qty: 60, min: 1,
    images: ["dry-fish-split", "dry-fish-dealer"],
    description: "Big sea fish split open and smoked over wood fires at the beach, then cut into portions. Mostly croaker and barracuda, depending on the week's landings. Packed in lined cartons.",
  },
  {
    seller: "oron", category: "fish-seafood", title: "Dried sole fish (Oron) — carton", slug: "dried-sole-fish-oron", unit: "carton (~10 kg)", price: null, qty: 40, min: 1, availability: "LIMITED",
    images: ["dry-solefish"],
    description: "Flat sole fish smoked and dried whole, stacked in cartons. Supply depends on the catch, so the price is set per order — send an inquiry with your quantity.",
  },
  {
    seller: "oron", category: "fish-seafood", title: "Oron crayfish — full bag", slug: "oron-crayfish-bag", unit: "bag", price: 135000, qty: 80, min: 1,
    images: ["crayfish-bags", "crayfish-tray"],
    description: "The well-known Oron crayfish: smoke-dried at the beach and sieved to reduce sand. Sold by the full market bag; half bags and paint-bucket measures available on request.\n\nPrices move with the season — lowest after the peak catch and highest in the rainy months.",
  },
  {
    seller: "oron", category: "fish-seafood", title: "Dried prawns (big size) — 5 kg", slug: "dried-prawns-5kg", unit: "5 kg bag", price: 85000, qty: 50, min: 1,
    images: ["prawns-dried"],
    description: "Large sun-dried prawns, cleaned and bagged. Rich flavour for soups, stews and jollof. Store in a cool dry place.",
  },
  {
    seller: "oron", category: "fish-seafood", title: "Fresh sea prawns — per kg", slug: "fresh-sea-prawns", unit: "kg", price: 12000, qty: 300, min: 10, availability: "LIMITED",
    images: ["prawns-fresh", "prawns-tray"],
    description: "Big fresh prawns from the morning landings at Oron and Ibaka beaches, iced immediately. Pickup at the beach or chilled delivery to Uyo, Calabar and Port Harcourt.",
  },
  {
    seller: "benue", category: "yam-tubers", title: "Benue white yam tubers (large)", slug: "benue-white-yam-large", unit: "tuber", price: 3500, qty: 5000, min: 100,
    images: ["yam-market"],
    description: "Large, well-cured white yam tubers (3–5 kg each) from Zaki Biam. Hand-selected for size and free of rot.",
  },
  {
    seller: "benue", category: "yam-tubers", title: "Yam tubers — 100-tuber lot", slug: "yam-tubers-100-lot", unit: "lot of 100", price: 320000, qty: 45, min: 1,
    images: ["yam-stack"],
    description: "Mixed medium and large tubers sold as a lot of 100. The best value for restaurants and resellers buying weekly.",
  },
  {
    seller: "benue", category: "grains-staples", title: "White garri — 50 kg bag", slug: "white-garri-50kg", unit: "50 kg bag", price: 42000, qty: 300, min: 5,
    images: ["garri"],
    description: "Fine, crisp white garri processed from fresh cassava. Well fried and sieved, packed in sealed 50 kg bags.",
  },
  {
    seller: "kano", category: "onions", title: "Red onions — 100 kg bag", slug: "red-onions-100kg", unit: "100 kg bag", price: 85000, qty: 400, min: 5,
    images: ["onions-pile"],
    description: "Firm, dry red onions from Kano and Kaduna farms. Graded to remove soft and sprouting bulbs before bagging.",
  },
  {
    seller: "kano", category: "onions", title: "Sorted dry onions — export grade", slug: "sorted-dry-onions-export", unit: "tonne", price: null, qty: 30, min: 1, availability: "PRE_ORDER",
    images: ["onions-sorting"],
    description: "Uniformly sized onions sorted for export and large processors. Pre-order for the next harvest window; pricing on request.",
  },
  {
    seller: "kano", category: "vegetables", title: "Fresh tomatoes — basket", slug: "fresh-tomatoes-basket", unit: "basket", price: 28000, qty: 250, min: 10, availability: "LIMITED",
    images: ["tomatoes"],
    description: "Freshly harvested Roma-type tomatoes in traditional baskets from Pambeguwa market. Supply is seasonal — confirm quantities before ordering.",
    city: "Pambeguwa", state: "Kaduna",
  },
  {
    seller: "kano", category: "vegetables", title: "Red chilli pepper — 25 kg bag", slug: "red-chilli-pepper-25kg", unit: "25 kg bag", price: 36000, qty: 120, min: 4,
    images: ["pepper"],
    description: "Hot red chilli pepper (ata rodo) sourced from farms in the South-West. Fresh and firm, bagged the day of dispatch.",
    city: "Osogbo", state: "Osun",
  },
  {
    seller: "ebonyi", category: "grains-staples", title: "Abakaliki local rice — 50 kg bag", slug: "abakaliki-rice-50kg", unit: "50 kg bag", price: 68000, qty: 500, min: 10,
    images: ["rice"],
    description: "Destoned, parboiled Abakaliki rice from local mills. Clean grains with a rich local flavour, packed in branded 50 kg bags.",
  },
  {
    seller: "ebonyi", category: "fruits", title: "Unripe plantain bunches", slug: "unripe-plantain-bunches", unit: "bunch", price: 7500, qty: 900, min: 20,
    images: ["plantain"],
    description: "Full, green plantain bunches from partner farms in Ondo State. Great for chips processors and restaurants.",
    city: "Akure", state: "Ondo",
  },
  {
    seller: "plateau", category: "grains-staples", title: "Fresh maize cobs — sack of 100", slug: "fresh-maize-cobs-sack", unit: "sack of 100 cobs", price: 18000, qty: 200, min: 5, status: "PENDING",
    images: ["maize"],
    description: "Sweet fresh maize from the Jos plateau, harvested the morning of dispatch. (Awaiting admin review.)",
  },
];

async function main() {
  // Remove previous sample data (cascades to profiles, products, inquiries, messages, saves and reports).
  await db.user.deleteMany({ where: { isSample: true } });

  const passwordHash = await bcrypt.hash(password!, 12);

  const categoryIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, imageUrl: img(c.image), sortOrder: i * 10 },
      create: { name: c.name, slug: c.slug, description: c.description, imageUrl: img(c.image), sortOrder: i * 10 },
    });
    categoryIds[c.slug] = row.id;
  }

  await db.user.create({
    data: { email: "admin@agritrade.test", name: "AgriTrade Admin", role: "ADMIN", passwordHash, isSample: true },
  });
  const buyer = await db.user.create({
    data: {
      email: "buyer@agritrade.test", name: "Amaka Okafor", phone: "+234 810 555 0101", role: "BUYER", passwordHash, isSample: true,
      companyName: "FreshMart Supermarket", city: "Ikeja", state: "Lagos",
    },
  });
  const buyer2 = await db.user.create({
    data: {
      email: "buyer2@agritrade.test", name: "Tunde Bakare", phone: "+234 811 555 0102", role: "BUYER", passwordHash, isSample: true,
      companyName: "Mama Put Kitchens", city: "Ibadan", state: "Oyo",
    },
  });

  const sellerIds: Record<string, { profileId: string; userId: string }> = {};
  for (const s of SELLERS) {
    const user = await db.user.create({
      data: {
        email: s.email, name: s.name, phone: s.phone, role: "SELLER", status: s.status, passwordHash, isSample: true,
        sellerProfile: {
          create: {
            businessName: s.business, slug: s.slug, city: s.city, state: s.state, phone: s.phone,
            yearsInBusiness: s.years, deliveryOptions: s.delivery, description: s.description,
            // Placeholder payout account so the escrow flow can be tried end to end.
            payoutBankName: "Sample Bank", payoutAccountNumber: "0123456789", payoutAccountName: s.business,
          },
        },
      },
      include: { sellerProfile: true },
    });
    sellerIds[s.key] = { profileId: user.sellerProfile!.id, userId: user.id };
  }

  const now = Date.now();
  const productIds: Record<string, string> = {};
  for (const [i, p] of PRODUCTS.entries()) {
    const seller = SELLERS.find((s) => s.key === p.seller)!;
    const created = new Date(now - (i + 1) * 5 * 60 * 60 * 1000);
    const row = await db.product.create({
      data: {
        sellerId: sellerIds[p.seller]!.profileId,
        categoryId: categoryIds[p.category]!,
        title: p.title,
        slug: p.slug,
        description: p.description,
        unit: p.unit,
        price: p.price,
        quantityAvailable: p.qty,
        minOrderQty: p.min,
        availability: p.availability ?? "IN_STOCK",
        status: p.status ?? "ACTIVE",
        city: p.city ?? seller.city,
        state: p.state ?? seller.state,
        deliveryOptions: p.delivery ?? seller.delivery,
        isSample: true,
        createdAt: created,
        updatedAt: created,
        images: { create: p.images.map((name, j) => ({ url: img(name), alt: p.title, sortOrder: j })) },
      },
    });
    productIds[p.slug] = row.id;
  }

  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);
  async function inquiry(opts: {
    buyerId: string; product: string; quantity: number; delivery: string; status: string;
    messages: { from: "buyer" | "seller"; body: string; at: number }[];
  }) {
    const p = PRODUCTS.find((x) => x.slug === opts.product)!;
    const seller = sellerIds[p.seller]!;
    const last = opts.messages[opts.messages.length - 1]!.at;
    await db.inquiry.create({
      data: {
        productId: productIds[opts.product], productTitle: p.title, buyerId: opts.buyerId, sellerId: seller.profileId,
        quantity: opts.quantity, deliveryPreference: opts.delivery, status: opts.status,
        createdAt: hoursAgo(opts.messages[0]!.at), updatedAt: hoursAgo(last),
        messages: {
          create: opts.messages.map((m) => ({
            senderId: m.from === "buyer" ? opts.buyerId : seller.userId, body: m.body, createdAt: hoursAgo(m.at),
          })),
        },
      },
    });
  }

  await inquiry({
    buyerId: buyer.id, product: "fresh-brown-eggs-crate-of-30", quantity: 60, delivery: "DELIVERY", status: "RESPONDED",
    messages: [
      { from: "buyer", at: 30, body: "Hello, we need 60 crates weekly for our Ikeja store. Can you deliver every Monday morning?" },
      { from: "seller", at: 26, body: "Good afternoon Amaka. Yes, Monday delivery to Ikeja works. For 60 crates weekly we can do ₦4,650 per crate including delivery." },
    ],
  });
  await inquiry({
    buyerId: buyer.id, product: "red-onions-100kg", quantity: 10, delivery: "DELIVERY", status: "OPEN",
    messages: [{ from: "buyer", at: 5, body: "Please share your delivery cost to Lagos for 10 bags, and how soon you can dispatch." }],
  });
  await inquiry({
    buyerId: buyer2.id, product: "smoked-catfish-carton", quantity: 8, delivery: "PICKUP", status: "RESPONDED",
    messages: [
      { from: "buyer", at: 50, body: "Is the smoked catfish fully dried? We store it for up to a month in our kitchens." },
      { from: "seller", at: 48, body: "Yes, it is double-smoked and dried. It keeps for 6–8 weeks in a cool, dry store." },
      { from: "buyer", at: 47, body: "Great. I'll send someone to pick up 8 cartons on Thursday." },
    ],
  });
  await inquiry({
    buyerId: buyer2.id, product: "benue-white-yam-large", quantity: 200, delivery: "DELIVERY", status: "CLOSED",
    messages: [
      { from: "buyer", at: 120, body: "Can you deliver 200 large tubers to Ibadan?" },
      { from: "seller", at: 118, body: "Yes — delivery to Ibadan is ₦60,000 for up to 300 tubers. We load on Tuesdays." },
      { from: "buyer", at: 110, body: "Received the yams, thank you. Closing this one." },
    ],
  });

  await db.savedProduct.createMany({
    data: ["abakaliki-rice-50kg", "fresh-live-catfish", "fresh-tomatoes-basket"].map((slug) => ({ userId: buyer.id, productId: productIds[slug]! })),
  });

  await db.report.create({
    data: {
      reporterId: buyer2.id, productId: productIds["mixed-sea-fish-basket"], reportedUserId: sellerIds.delta!.userId,
      reason: "MISLEADING", details: "Photo shows a whole market; it is not clear what is actually in the basket.",
    },
  });

  console.log(`Seeded ${CATEGORIES.length} categories, ${SELLERS.length + 3} sample accounts and ${PRODUCTS.length} sample listings.`);
  console.log("Demo accounts (password = SEED_DEMO_PASSWORD): admin@agritrade.test, buyer@agritrade.test, seller@agritrade.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
