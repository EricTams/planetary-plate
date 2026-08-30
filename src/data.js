import { COOL, WARM, NEUTRAL, T } from "./theme.js";

/* Food-group definitions and the seed dish library.
   All quantities are grams as eaten unless a unit says otherwise. */

export const DAILY_KCAL = 2500; // PHD reference energy intake

/* Promote groups — daily targets in grams AS EATEN.
   Grains and legumes are converted from the published dry-weight targets
   (232 g and 75 g dry) at ~2.5x / 2.4x cooked yield. Every target and every
   density below is derived from the reference table's own gram and kcal
   figures, so a day at target reconciles to DAILY_KCAL instead of falling
   hundreds of kcal short. */
export const PROMOTE = [
  { id: "wholeGrains", label: "Whole grains", short: "Grains", unit: "g cooked", target: 525, hint: "ELI 2.0 210 g dry ≈ 525 g cooked" },
  { id: "legumes", label: "Legumes", short: "Legumes", unit: "g cooked", target: 180, hint: "ELI 2.0 75 g dry (0–150) ≈ 180 g cooked · tofu and tempeh count here at full credit" },
  { id: "vegetables", label: "Vegetables", short: "Veg", unit: "g", target: 300, hint: "ELI 2.0 300 g (200–600)" },
  { id: "fruits", label: "Fruits", short: "Fruit", unit: "g", target: 200, hint: "ELI 2.0 200 g (100–300)" },
  { id: "nuts", label: "Nuts & peanuts", short: "Nuts", unit: "g", target: 50, hint: "ELI 2.0 50 g (0–75)" },
  { id: "dairy", label: "Dairy", short: "Dairy", unit: "g milk-eq", target: 250, hint: "ELI 2.0 250 g (0–500) in milk equivalents — cheese ×5, butter ×6.5, cream ×2.7, milk and yogurt ×1" },
  { id: "plantOils", label: "Unsaturated plant oils", short: "Oils", unit: "g", target: 40, hint: "ELI 2.0 40 g (20–80) — seed, olive, sesame, chili oil" },
  { id: "tubers", label: "Starchy roots & tubers", short: "Tubers", unit: "g", target: 50, hint: "ELI 2.0 50 g (0–100) — a limited group" },
];

/* Capped groups — daily ceilings in grams (range tops of PHD 2.0).
   `from` points at the promote-group field the amount is read from, so
   dairy, plant oils and tubers are entered once and both credited and capped.
   Sodium is excluded by design. */
export const CAPS = [
  { id: "redMeat", label: "Red meat", cap: 30, hint: "ELI 2.0 15 g (0–30) — beef, pork, lamb" },
  { id: "poultry", label: "Poultry", cap: 60, hint: "ELI 2.0 30 g (0–60)" },
  { id: "fish", label: "Fish & shellfish", cap: 100, hint: "ELI 2.0 30 g (0–100) — emphasised in the index, kept limited here by choice" },
  { id: "eggs", label: "Eggs", short: "Eggs", cap: 25, hint: "0–25 g/day" },
  { id: "dairyCap", label: "Dairy", short: "Dairy", cap: 500, hint: "0–500 g milk-eq/day — cheese ×5, cream ×2.7", from: "dairy" },
  { id: "plantOilsCap", label: "Plant oils (ceiling)", cap: 80, hint: "0–80 g/day", from: "plantOils" },
  { id: "tubersCap", label: "Starchy roots & tubers", short: "Tubers", cap: 100, hint: "0–100 g/day", from: "tubers" },
  { id: "addedSugar", label: "Added sugar", short: "Sugar", cap: 60, hint: "ELI 2.0 30 g, upper 60 assumed at 2× target" },
  { id: "animalTropFat", label: "Animal / tropical fat", short: "Sat fat", cap: 18, hint: "ELI 2.0 11 g (0–18) — butter, lard, tallow, palm, coconut" },
  { id: "ultraProcessed", label: "Ultra-processed foods", short: "UPF", cap: 250,
    hint: "≈20% of energy — a working number, not a Commission figure" },
];

/* Approximate energy densities (kcal/g, as eaten). The promote groups price
   displacement inside headroom; the rest are here only so a dish's entered
   grams can be totalled into tracked energy. All are rough central values —
   good enough to tell a 300 kcal entry from a 900 kcal one, not a nutrition
   label. */
export const KCAL_PER_G = {
  // promote groups — each is the reference table's kcal divided by its target,
  // so target x density reproduces the published per-group energy exactly
  wholeGrains: 1.40, legumes: 1.58, vegetables: 0.26,
  fruits: 0.63, nuts: 5.82, dairy: 0.61, plantOils: 8.85, tubers: 0.78,
  // bridge foods
  refinedPasta: 1.6, fieldRoast: 2.2, beyond: 2.5,
  // capped groups entered on their own
  redMeat: 2.5, poultry: 1.9, fish: 1.6, eggs: 1.45,
  addedSugar: 4.0, animalTropFat: 8.0, ultraProcessed: 4.0,
  // inert starches
  whiteRice: 1.30, riceNoodles: 1.10, refinedBread: 2.70, refinedStarch: 3.50,
};

/* Inert foods — the refined starches the taxonomy has no slot for. They earn
   no group credit and hit no ceiling, but they are eaten, so they carry their
   energy and take up room in the day like anything else. Leaving them out made
   a bowl of noodles cost nothing at all. */
export const INERT = [
  { id: "whiteRice", label: "White rice", short: "Rice", unit: "g cooked" },
  { id: "riceNoodles", label: "Rice noodles", short: "Noodles", unit: "g cooked" },
  { id: "refinedBread", label: "Refined bread & pita", short: "Bread", unit: "g" },
  { id: "refinedStarch", label: "Refined starch & coatings", short: "Starch", unit: "g dry" },
];

/* Bridge foods — inert under strict EAT-Lancet taxonomy, partially
   credited in evidence-adjusted mode:
   - refined pasta: GI ~45–55 vs ~70–90 for white rice and bread (dense
     gluten-starch matrix), but lacks whole-grain fiber
   - Field Roast / seitan: wheat gluten; does legumes' protein-source
     job, none of their fiber or phytochemicals
   - Beyond Burger: pea-protein isolate, legume-origin but fiber-stripped
   Tofu is not a bridge food — it is entered under legumes at full credit. */
export const BRIDGE = [
  { id: "refinedPasta", label: "Refined pasta", unit: "g cooked", creditsTo: "wholeGrains", creditKey: "pastaCredit" },
  { id: "fieldRoast", label: "Field Roast / seitan", unit: "g", creditsTo: "legumes", creditKey: "fieldRoastCredit", upfFraction: 0.5 },
  { id: "beyond", label: "Beyond Burger", unit: "g", creditsTo: "legumes", creditKey: "beyondCredit", upfFraction: 0.8 },
];

/* ELI 2.0 group tables, transcribed from the published index.

   Three band schemes, not one. Vegetables, fruits and oils are graded against
   their reference interval; legumes, nuts and wholegrains against fractions of
   their target; limited groups against their upper limit.

   Fish sits with the emphasised groups in the published index. It is kept on
   the limited side here by deliberate choice — this library does not count
   fish as something to be eaten, so requiring it would penalise every dish in
   it. Sodium is omitted by design for the same kind of reason.

   Legume and wholegrain targets are the cooked equivalents of the published
   75 g and 210 g dry, so they can be compared against compositions entered as
   eaten. */
export const ELI_INTERVAL = [
  { id: "vegetables", target: 300, lower: 200 },
  { id: "fruits", target: 200, lower: 100 },
  { id: "plantOils", target: 40, lower: 20 },
];

export const ELI_FRACTION = [
  { id: "legumes", target: 180 },     // 75 g dry
  { id: "nuts", target: 50 },
  { id: "wholeGrains", target: 525 }, // 210 g dry
];

export const ELI_LIMITED = [
  { id: "redMeat", target: 15, upper: 30 },
  { id: "poultry", target: 30, upper: 60 },
  { id: "eggs", target: 15, upper: 25 },
  { id: "fish", target: 30, upper: 100 },
  { id: "dairy", target: 250, upper: 500 },
  { id: "tubers", target: 50, upper: 100 },
  { id: "animalTropFat", target: 11, upper: 18 },
  { id: "addedSugar", target: 30, upper: 60 },
];

/* Groups that earn adherence by intake. Dairy and tubers are excluded:
   their PHD ranges start at zero and ELI 2.0 classes both as limited,
   so they are scored on restraint instead. */
export const EMPHASISED = PROMOTE.filter((g) => g.id !== "dairy" && g.id !== "tubers");

/* The two halves of the group-profile chart. Positives are the six groups a
   dish earns credit for; negatives are the six ceilings it can push against.
   Red meat, poultry and fish are omitted — this library is vegetarian, and
   their bars would sit flat. Plant oils appear only as a positive: the group
   is entered once and its ceiling still binds inside headroom. */
export const POSITIVE_BARS = EMPHASISED.map((g, i) => ({ ...g, color: COOL[i] }));
export const NEGATIVE_BARS = CAPS
  .filter((c) => !["redMeat", "poultry", "fish", "plantOilsCap"].includes(c.id))
  .map((c, i) => ({ ...c, color: WARM[i] }));

/* Every composition field exactly once, in the order they stack in the
   tracked-energy bar: what a dish delivers, then the bridge foods, then what
   it spends against ceilings. Capped groups read through `from`, so dairy,
   tubers and plant oils are not counted twice. */
export const ENERGY_GROUPS = [
  // each promote group is followed by the bridge foods that credit into it, so
  // a bridge segment sits beside the category it is standing in for
  ...POSITIVE_BARS.flatMap((g) => [
    { id: g.id, label: g.label, color: g.color },
    ...BRIDGE.filter((b) => b.creditsTo === g.id).map((b) => ({
      id: b.id,
      label: b.label,
      color: NEUTRAL.bridge,
      creditsTo: g.id,
      creditsToLabel: g.label,
      creditColor: g.color,
      creditKey: b.creditKey,
    })),
  ]),
  ...NEGATIVE_BARS.map((c) => ({ id: c.from || c.id, label: c.label, color: c.color })),
  ...CAPS.filter((c) => ["redMeat", "poultry", "fish"].includes(c.id))
    .map((c) => ({ id: c.id, label: c.label, color: NEUTRAL.meat })),
  ...INERT.map((i) => ({ id: i.id, label: i.label, color: NEUTRAL.inert, inert: true })),
];

/* Colour for any group id. ENERGY_GROUPS is keyed by composition field, so
   this resolves dairy, tubers and the bridge foods; the cap ids are added on
   top because dairy and tubers are charted as dairyCap and tubersCap. */
const BAR_COLORS = Object.fromEntries([
  ...ENERGY_GROUPS.map((g) => [g.id, g.color]),
  ...NEGATIVE_BARS.map((c) => [c.id, c.color]),
]);
export const barColor = (id) => BAR_COLORS[id] || T.muted;

const GROUP_LABELS = Object.fromEntries(ENERGY_GROUPS.map((g) => [g.id, g.label]));
export const groupLabel = (id) => GROUP_LABELS[id] || id;

export const EMPTY = {
  wholeGrains: 0, legumes: 0, vegetables: 0, fruits: 0, nuts: 0, dairy: 0,
  plantOils: 0, tubers: 0,
  refinedPasta: 0, fieldRoast: 0, beyond: 0,
  whiteRice: 0, riceNoodles: 0, refinedBread: 0, refinedStarch: 0,
  redMeat: 0, poultry: 0, fish: 0, eggs: 0, addedSugar: 0, animalTropFat: 0, ultraProcessed: 0,
};

/* Completeness weights are gram-proportional for the emphasised groups.
   Dairy and tubers default to 0 — you cannot earn adherence by eating
   more of them. Their ceilings still bind in headroom. */
const LARGEST_TARGET = Math.max(...PROMOTE.map((g) => g.target));

export const DEFAULT_WEIGHTS = Object.fromEntries(
  PROMOTE.map((g) => [
    g.id,
    g.id === "dairy" || g.id === "tubers" ? 0 : +(g.target / LARGEST_TARGET).toFixed(2),
  ])
);

/* What a day that hits every target actually costs: promote groups at their
   targets, plus the limited groups at the target level the ELI score rewards.
   This is the denominator the portion share is measured against — a dish is
   whatever fraction of this its own tracked energy comes to. It lands well
   below DAILY_KCAL; the difference is the inert food (white rice, bread) the
   taxonomy has no slot for. */
export const TARGET_DAY_KCAL =
  PROMOTE.reduce((sum, g) => sum + g.target * KCAL_PER_G[g.id], 0) +
  ELI_LIMITED
    .filter((l) => l.id !== "dairy" && l.id !== "tubers") // already in PROMOTE
    .reduce((sum, l) => sum + l.target * KCAL_PER_G[l.id], 0);

export const DEFAULT_SETTINGS = {
  portionMode: "auto",
  portionPct: 40,
  mode: "evidence",
  pastaCredit: 0.35,
  fieldRoastCredit: 0.6,
  beyondCredit: 0.7,
};

/* Composition = grams in one reference portion (default 40% of daily energy). */
export const SEED_DISHES = [
  {
    id: "beyaynetu", source: "restaurant", name: "Beyaynetu (Ethiopian veg combo)",
    note: "Misir wot, kik alicha, shiro, gomen and tikil gomen on teff injera, built on niter kibbeh. One share of a restaurant platter split two ways.",
    comp: { ...EMPTY, wholeGrains: 240, legumes: 225, vegetables: 115, plantOils: 16, animalTropFat: 8, tubers: 25 },
  },
  {
    id: "puttanesca", source: "home", name: "Field Roast puttanesca",
    note: "Semolina pasta, Italian Field Roast, tomatoes, onion, garlic, kalamata olives, capers, Calabrian chillies, anchovies, herbs and parmesan.",
    comp: { ...EMPTY, vegetables: 269, dairy: 53, refinedPasta: 262, fieldRoast: 92, fish: 4, plantOils: 11 },
  },
  {
    id: "sundubu", source: "home", name: "Sundubu jjigae",
    note: "Silken tofu, kimchi, daikon and aromatics in veggie broth, with Beyond in place of the pork and no egg. One of four shares of the pot, with rice alongside.",
    comp: { ...EMPTY, legumes: 88, vegetables: 63, beyond: 20, plantOils: 5, whiteRice: 220 },
  },
  {
    id: "mapo", source: "home", name: "Vegetarian mapo tofu",
    note: "Tofu, doubanjiang, scallion, bell pepper and green peas in veggie stock, with Beyond in place of the pork. One of four shares of the batch, with rice underneath.",
    comp: { ...EMPTY, legumes: 99, vegetables: 44, beyond: 21, addedSugar: 1, plantOils: 11, whiteRice: 220 },
  },
  {
    id: "chili", source: "home", name: "Beyond & three-bean chili",
    note: "Beyond, three beans, hominy, tomatoes, tomatillos, chipotle, green chiles, jalapeño, bell pepper and corn. Sour cream and cheddar toppings ≈ 200 g milk-eq.",
    comp: { ...EMPTY, legumes: 130, wholeGrains: 65, vegetables: 300, dairy: 200, beyond: 113, plantOils: 8 },
  },
  {
    id: "gochujangTofu", source: "home", name: "Gochujang crispy tofu bowl",
    note: "Baked tofu in potato starch, gochujang-soy-corn syrup glaze, dressed broccoli and sesame seeds, over rice. No egg.",
    comp: { ...EMPTY, legumes: 132, vegetables: 226, nuts: 4, addedSugar: 11, plantOils: 15, refinedStarch: 13, whiteRice: 210 },
  },
  {
    id: "pho", source: "home", name: "Veggie pho with tofu",
    note: "Veggie broth, tofu, straw mushrooms, bean sprouts, herbs and the fixins. Rice noodles are inert — they lack pasta's gluten-starch matrix, so no bridge credit.",
    comp: { ...EMPTY, legumes: 150, vegetables: 140, addedSugar: 5, plantOils: 3, riceNoodles: 200 },
  },
  {
    id: "cashewTofu", source: "restaurant", name: "Cashew tofu stir-fry",
    note: "Tofu, cashews, bell pepper, celery, onion and a soy-based sauce.",
    comp: { ...EMPTY, legumes: 180, vegetables: 140, nuts: 30, addedSugar: 10, plantOils: 20, whiteRice: 200 },
  },
  {
    id: "vegThali", source: "restaurant", name: "Veg thali with raita",
    note: "Dal, sabzi, aloo, roti, rice, raita, papad, pickle and salad, with ghee across the tray.",
    comp: { ...EMPTY, legumes: 150, wholeGrains: 90, vegetables: 150, tubers: 70, dairy: 80, plantOils: 26, animalTropFat: 8, whiteRice: 150 },
  },
  {
    id: "mezze", source: "restaurant", name: "Vegan mezze + falafel",
    note: "Falafel, hummus, mercimek köfte, salad, walnut muhammara and olives.",
    comp: { ...EMPTY, legumes: 200, vegetables: 110, nuts: 15, plantOils: 28, refinedBread: 90 },
  },
  {
    id: "beanTacos", source: "restaurant", name: "Calabacita tacos + frijoles",
    // The lard is an assumption: taquerias normally make frijoles refritos with
    // manteca, but a kitchen asked for vegetarian beans would use oil instead.
    // It is the single largest lever on this dish's score.
    note: "Three squash tacos on a plate with Mexican rice and refried beans made with lard, with crema and queso fresco.",
    comp: { ...EMPTY, wholeGrains: 90, legumes: 120, vegetables: 135, dairy: 140, plantOils: 23, animalTropFat: 8, whiteRice: 160 },
  },
  {
    id: "cheesePlate", source: "home", name: "Cheese plate",
    note: "Cheese (90 g ≈ 450 g milk-eq), walnuts, grapes and wholegrain crackers.",
    comp: { ...EMPTY, dairy: 450, nuts: 22, fruits: 70, wholeGrains: 40 },
  },
];
