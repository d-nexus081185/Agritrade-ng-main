const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  const before = {
    users: await db.user.count(),
    products: await db.product.count(),
    categories: await db.category.count(),
  };

  console.log("BEFORE", before);

  const categories = [
  { slug: "vegetables", name: "Vegetables", description: "Fresh vegetables and tomatoes", imageUrl: "/images/tomatoes.jpg", sortOrder: 0 },
  { slug: "eggs", name: "Eggs", description: "Poultry eggs and trays", imageUrl: "/images/eggs-sack.jpg", sortOrder: 10 },
  { slug: "fish-seafood", name: "Fish & Seafood", description: "Fresh and smoked seafood", imageUrl: "/images/catfish-smoked.jpg", sortOrder: 20 },
  { slug: "onions", name: "Onions", description: "Red and dry onions in bulk", imageUrl: "/images/onions-pile.jpg", sortOrder: 30 },
  { slug: "yam-tubers", name: "Yam & Tubers", description: "Bulk root crops and staples", imageUrl: "/images/yam-market.jpg", sortOrder: 40 },
  { slug: "grains-staples", name: "Grains & Staples", description: "Rice, millet and staples", imageUrl: "/images/rice.jpg", sortOrder: 50 },
  { slug: "seafood", name: "Seafood", description: "Crayfish, dried fish and shellfish essentials", imageUrl: "/images/crayfish-bags.jpg", sortOrder: 60 },
  { slug: "oilseeds", name: "Oilseeds & Seeds", description: "Groundnut, egwusi, ogbono and seed ingredients", imageUrl: "/images/palm-oil-sales.jpg", sortOrder: 70 },
  { slug: "spices", name: "Spices & Seasonings", description: "Pepper, seasoning blends and cooking spices", imageUrl: "/images/pepper.jpg", sortOrder: 80 },
];

const categoryMap = {};
for (const item of categories) {
  const row = await db.category.upsert({
    where: { slug: item.slug },
    update: { imageUrl: item.imageUrl, name: item.name, description: item.description, sortOrder: item.sortOrder },
    create: item,
  });
  categoryMap[item.slug] = row.id;
}

const passwordHash = await bcrypt.hash("DemoPass123", 12);

const user = await db.user.upsert({
  where: { email: "demo.seller@agritrade.test" },
  update: {},
  create: {
    email: "demo.seller@agritrade.test",
    name: "Demo Farm Co.",
    phone: "+234 800 000 0000",
    role: "SELLER",
    status: "ACTIVE",
    passwordHash,
    isSample: true,
  },
});

const profile = await db.sellerProfile.upsert({
  where: { userId: user.id },
  update: {},
  create: {
    userId: user.id,
    businessName: "Demo Farm Co.",
    slug: "demo-farm-co",
    city: "Lagos",
    state: "Lagos",
    phone: "+234 800 000 0000",
    deliveryOptions: "DELIVERY,PICKUP",
    yearsInBusiness: 5,
    description: "Sample seller for local development.",
  },
});

const products = [
  {
    slug: "demo-fresh-tomatoes-crate",
    title: "Demo Fresh Tomatoes",
    unit: "crate",
    price: 3500,
    quantityAvailable: 200,
    minOrderQty: 10,
    availability: "IN_STOCK",
    description: "Freshly harvested tomatoes for restaurants and retailers.",
    city: "Lagos",
    state: "Lagos",
    category: "vegetables",
    image: "/images/tomatoes.jpg",
    alt: "Fresh tomatoes",
  },
  {
    slug: "demo-brown-eggs-tray",
    title: "Brown Eggs Tray",
    unit: "tray of 30",
    price: 2200,
    quantityAvailable: 320,
    minOrderQty: 25,
    availability: "IN_STOCK",
    description: "Large brown eggs collected daily from healthy layer birds.",
    city: "Abeokuta",
    state: "Ogun",
    category: "eggs",
    image: "/images/eggs-sack.jpg",
    alt: "Eggs in sacks at a Nigerian market",
  },
  {
    slug: "demo-catfish-fresh-bag",
    title: "Fresh Catfish Bag",
    unit: "25 kg bag",
    price: 42000,
    quantityAvailable: 85,
    minOrderQty: 2,
    availability: "LIMITED",
    description: "Fresh pond-raised catfish graded and packed for market supply.",
    city: "Warri",
    state: "Delta",
    category: "fish-seafood",
    image: "/images/catfish-fresh.jpg",
    alt: "Fresh catfish",
  },
  {
    slug: "demo-red-onions-100kg",
    title: "Red Onions 100kg",
    unit: "100 kg bag",
    price: 85000,
    quantityAvailable: 160,
    minOrderQty: 5,
    availability: "IN_STOCK",
    description: "Dry red onions sorted and packed for retail and wholesale buyers.",
    city: "Kano",
    state: "Kano",
    category: "onions",
    image: "/images/onions-pile.jpg",
    alt: "Onion pile",
  },
  {
    slug: "demo-white-yam-tubers",
    title: "White Yam Tubers",
    unit: "tuber",
    price: 3500,
    quantityAvailable: 1200,
    minOrderQty: 100,
    availability: "IN_STOCK",
    description: "Large white yam tubers with a long shelf life and strong market demand.",
    city: "Zaki Biam",
    state: "Benue",
    category: "yam-tubers",
    image: "/images/yam-market.jpg",
    alt: "Yam market",
  },
  {
    slug: "demo-local-rice-50kg",
    title: "Local Rice 50kg",
    unit: "50 kg bag",
    price: 68000,
    quantityAvailable: 90,
    minOrderQty: 8,
    availability: "IN_STOCK",
    description: "Clean local rice packed in sealed 50 kg bags for distributors and shops.",
    city: "Abakaliki",
    state: "Ebonyi",
    category: "grains-staples",
    image: "/images/rice.jpg",
    alt: "Rice bags",
  },
  {
    slug: "demo-crayfish-bag",
    title: "Premium Crayfish Bag",
    unit: "5 kg bag",
    price: 28000,
    quantityAvailable: 120,
    minOrderQty: 5,
    availability: "IN_STOCK",
    description: "Clean, sun-dried crayfish ideal for soups, stews and seasoning blends.",
    city: "Port Harcourt",
    state: "Rivers",
    category: "seafood",
    image: "/images/crayfish-bags.jpg",
    alt: "Crayfish bags",
  },
  {
    slug: "demo-dried-fish-basket",
    title: "Dried Fish Basket",
    unit: "basket",
    price: 24000,
    quantityAvailable: 80,
    minOrderQty: 3,
    availability: "LIMITED",
    description: "Well-processed stock fish for households, restaurants and local retail channels.",
    city: "Calabar",
    state: "Cross River",
    category: "seafood",
    image: "/images/dry-fish-stack.jpg",
    alt: "Dried fish stack",
  },
  {
    slug: "demo-dried-egwusi",
    title: "Dried Egwusi Seeds",
    unit: "10 kg sack",
    price: 18500,
    quantityAvailable: 140,
    minOrderQty: 2,
    availability: "IN_STOCK",
    description: "Premium dried egwusi seeds for soups and culinary preparation.",
    city: "Enugu",
    state: "Enugu",
    category: "oilseeds",
    image: "/images/pepper.jpg",
    alt: "Fresh Nigerian pepper displayed for sale",
  },
  {
    slug: "demo-ogbono-seeds",
    title: "Ogbono Seeds",
    unit: "10 kg bag",
    price: 20000,
    quantityAvailable: 110,
    minOrderQty: 2,
    availability: "IN_STOCK",
    description: "High-quality ogbono for family meals and food service businesses.",
    city: "Onitsha",
    state: "Anambra",
    category: "oilseeds",
    image: "/images/garri.jpg",
    alt: "Nigerian food ingredient displayed for sale",
  },
  {
    slug: "demo-millet-bag",
    title: "Millet Grain Bag",
    unit: "50 kg bag",
    price: 47000,
    quantityAvailable: 95,
    minOrderQty: 5,
    availability: "IN_STOCK",
    description: "Clean millet grains suitable for porridge, local preparation and distribution.",
    city: "Kaduna",
    state: "Kaduna",
    category: "grains-staples",
    image: "/images/rice.jpg",
    alt: "Nigerian grain bags in a market",
  },
  {
    slug: "demo-groundnut-bags",
    title: "Groundnut Supply",
    unit: "25 kg bag",
    price: 33000,
    quantityAvailable: 140,
    minOrderQty: 6,
    availability: "IN_STOCK",
    description: "Groundnuts sorted for retail, grinding, and food processing needs.",
    city: "Bauchi",
    state: "Bauchi",
    category: "oilseeds",
    image: "/images/groundnut-sacks-kano.jpg",
    alt: "Groundnut sacks stacked for sale in Kano",
  },
  {
    slug: "demo-spice-mix",
    title: "African Spice Mix",
    unit: "10 kg pack",
    price: 16000,
    quantityAvailable: 175,
    minOrderQty: 10,
    availability: "IN_STOCK",
    description: "Blended pepper and seasoning mix for home cooks and bulk food operations.",
    city: "Ibadan",
    state: "Oyo",
    category: "spices",
    image: "/images/pepper.jpg",
    alt: "African spice mix",
  },
];

for (const item of products) {
  await db.product.upsert({
    where: { slug: item.slug },
    update: {
      sellerId: profile.id,
      categoryId: categoryMap[item.category],
      title: item.title,
      description: item.description,
      unit: item.unit,
      price: item.price,
      quantityAvailable: item.quantityAvailable,
      minOrderQty: item.minOrderQty,
      availability: item.availability,
      status: "ACTIVE",
      city: item.city,
      state: item.state,
      deliveryOptions: "DELIVERY,PICKUP",
      isSample: true,
    },
    create: {
      sellerId: profile.id,
      categoryId: categoryMap[item.category],
      title: item.title,
      slug: item.slug,
      description: item.description,
      unit: item.unit,
      price: item.price,
      quantityAvailable: item.quantityAvailable,
      minOrderQty: item.minOrderQty,
      availability: item.availability,
      status: "ACTIVE",
      city: item.city,
      state: item.state,
      deliveryOptions: "DELIVERY,PICKUP",
      isSample: true,
      images: {
        create: [{ url: item.image, alt: item.alt, sortOrder: 0 }],
      },
    },
  });
}

const requestedProductImages = {
  "demo-dried-egwusi": "/images/pepper.jpg",
  "demo-groundnut-bags": "/images/groundnut-sacks-kano.jpg",
  "demo-millet-bag": "/images/rice.jpg",
  "demo-ogbono-seeds": "/images/garri.jpg",
};

for (const [slug, url] of Object.entries(requestedProductImages)) {
  const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) continue;

  await db.productImage.deleteMany({ where: { productId: product.id } });
  await db.productImage.create({
    data: { productId: product.id, url, alt: `${slug.replace("demo-", "").replace(/-/g, " ")} image`, sortOrder: 0 },
  });
}

console.log("AFTER", {
  users: await db.user.count(),
  products: await db.product.count(),
  categories: await db.category.count(),
  sampleSeller: user.email,
  sampleProductCount: products.length,
});
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
