/* ═══════════════════════════════════════════════
   SELLTHEAD — data.js
   Product catalogue & discount codes
═══════════════════════════════════════════════ */

const PRODUCTS = [
  {
    id: 4,
    title: "Bullar Men's Compression T-Shirt",
    shortTitle: "Bullar Compression Tee",
    brand: "BULLAR",
    type: "Gym Workout T-Shirt",
    slug: "bullar-compression-tee",
    price: 289,
    oldPrice: 399,
    rating: 4.8,
    reviews: 127,
    category: ["compression"],
    tags: ["Compression", "Dry Fit", "Gym", "Polyester", "Athletic", "Bullar"],
    image: "images/bullar_ct_2.png",
    images: [
      "images/bullar_ct_2.png",
      "images/bullar_ct_1.png",
      "images/bullar_ct_3.png",
      "images/bullar_ct_4.png"
    ],
    description: "Upgrade your training game with this high-performance Compression T-Shirt, engineered for athletes who demand more. Crafted from a premium polyester blend, it delivers superior 4-way stretch, gym-proof durability, and a second-skin fit that moves with you. The muscle-support compression design enhances blood circulation, boosts performance, and speeds up recovery — making it the ultimate men's activewear essential.\n\nBuilt with advanced moisture-wicking Dry-Fit technology, this quick-dry gym tee keeps you cool, dry, and comfortable through intense workouts. The ergonomic half-sleeve cut, crew neck, and reinforced stitching provide a sleek, modern athletic look with long-lasting quality.",
    highlights: [
      "Premium Polyester Blend — 4-Way Stretch",
      "Moisture-Wicking Dry-Fit Technology",
      "Muscle-Support Compression Design",
      "Ergonomic Crew Neck + Half Sleeve Cut",
      "Reinforced Stitching for Long-Lasting Durability",
      "Quick-Dry — Perfect for Intense Sessions",
      "Country of Origin: India"
    ],
    fabric: "Polyester",
    sleeve: "Short Sleeves",
    fit: "Compression / Second Skin",
    sizeChart: [
      { size: "S",  chest: "36 in", length: "25 in" },
      { size: "L",  chest: "40 in", length: "26 in" },
      { size: "XL", chest: "38 in", length: "26 in" }
    ],
    sizes: ["S", "L", "XL"],
    inStock: true,
    featured: true
  },
  {
    id: 5,
    title: "Wooden Parallettes Handle",
    shortTitle: "Wooden Push-Up Bars",
    brand: "HUB",
    type: "Calisthenics Equipment",
    slug: "wooden-parallettes",
    price: 510,
    oldPrice: 699,
    rating: 4.6,
    reviews: 89,
    category: ["equipment"],
    tags: ["Parallettes", "Push-Up Bars", "Calisthenics", "Wooden", "Home Gym", "Bodyweight"],
    image: "images/parallettes_1.png",
    images: [
      "images/parallettes_1.png",
      "images/parallettes_2.png",
      "images/parallettes_3.png"
    ],
    description: "Enhance your home workout routine with the HUB Push Up Stand Wooden, designed for both men and women who want to improve strength, stability, and form. Crafted from durable, eco-friendly wood, this wooden parallettes handle offers a sturdy, comfortable grip for a variety of exercises including push-ups, dips, L-sits, and core workouts.\n\nFeaturing a non-slip base, this push-up stand ensures maximum safety and stability on any surface, preventing slips and injuries during intense training sessions. Its ergonomic design reduces wrist strain and allows a greater range of motion, helping you target muscles more effectively while protecting your joints.",
    highlights: [
      "Made from Durable, Eco-Friendly Wood for Long-Lasting Use",
      "Non-Slip Base — Maximum Safety on Any Surface",
      "Ergonomic Design — Reduces Wrist Strain",
      "Increases Range of Motion vs Floor Push-Ups",
      "Lightweight & Portable — Easy Storage & Travel",
      "Suitable for Push-Ups, Dips, L-Sits, Core Work",
      "Dimensions: 25cm Length × 14cm Base × 11cm Height",
      "Country of Origin: India"
    ],
    fabric: "Solid Wood",
    sleeve: "—",
    fit: "One Size",
    sizeChart: [],
    sizes: ["One Size"],
    inStock: true,
    featured: true
  },
  {
    id: 6,
    title: "Worldfit Weight Lifting Straps",
    shortTitle: "Worldfit Lifting Straps",
    brand: "WORLDFIT",
    type: "Gym Wrist Support",
    slug: "worldfit-lifting-straps",
    price: 198,
    oldPrice: 300,
    rating: 4.7,
    reviews: 214,
    category: ["equipment"],
    tags: ["Lifting Straps", "Wrist Support", "Gym Accessories", "Deadlift", "Grip", "Worldfit"],
    image: "images/straps_1.png",
    images: [
      "images/straps_1.png",
      "images/straps_2.png",
      "images/straps_3.png",
      "images/straps_4.png"
    ],
    description: "Upgrade your lifting game with Worldfit Weight Lifting Straps — engineered for serious gym-goers who demand maximum grip and wrist support. Built from premium cotton with reinforced stitching, these straps wrap securely around the bar to eliminate grip fatigue, letting you focus on what matters — lifting heavier and going longer.\n\nFeaturing 6mm soft neoprene padding for added wrist comfort and an adjustable loop system, these straps fit all wrist sizes and work across all pulling movements. Whether you're deadlifting, rowing, or doing lat pulldowns — Worldfit delivers.",
    highlights: [
      "Premium Cotton Build with Reinforced Stitching",
      "6mm Neoprene Padding — Wrist Comfort & Support",
      "Adjustable Loop for Secure, Custom Fit",
      "Eliminates Grip Fatigue on Heavy Pulls",
      "For Deadlifts, Rows, Pull-Ups, Lat Pulldowns",
      "Fits Men & Women — Free Size",
      "Brand: Worldfit — Built for Performance",
      "Country of Origin: India"
    ],
    fabric: "Cotton",
    sleeve: "—",
    fit: "Free Size",
    sizeChart: [],
    sizes: ["Free Size"],
    inStock: true,
    featured: true
  },
];

const DISCOUNT_CODES = {
  "PRIYANSH10": 10,
  "DISHANT10": 10,
  "PRATIK10": 10,
  "SAURABH10": 10,
  "SAMAR10": 10,
  "PRINCE10": 10
};

const WHATSAPP_NUMBER = "917568521210";
