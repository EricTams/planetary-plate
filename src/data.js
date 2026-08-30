import { COOL, WARM, NEUTRAL, T } from "./theme.js";

/* Food-group definitions and the seed dish library.
   All quantities are grams as eaten unless a unit says otherwise. */

export const DAILY_KCAL = 2400; // PHD 2.0 reference energy intake

/* Promote groups — daily targets in grams AS EATEN.
   Grains and legumes are converted from PHD dry-weight targets
   (150 g and 75 g dry) at ~2.5x / 2.4x cooked yield. */
export const PROMOTE = [
  { id: "wholeGrains", label: "Whole grains", short: "Grains", unit: "g cooked", target: 375, hint: "PHD 150 g dry ≈ 375 g cooked" },
  { id: "legumes", label: "Legumes", short: "Legumes", unit: "g cooked", target: 180, hint: "PHD 75 g dry ≈ 180 g cooked · tofu and tempeh count here at full credit" },
  { id: "vegetables", label: "Vegetables", short: "Veg", unit: "g", target: 300, hint: "PHD 300 g (200–600)" },
  { id: "fruits", label: "Fruits", short: "Fruit", unit: "g", target: 200, hint: "PHD 200 g (100–300)" },
  { id: "nuts", label: "Nuts & peanuts", short: "Nuts", unit: "g", target: 25, hint: "PHD 25 g" },
  { id: "dairy", label: "Dairy", short: "Dairy", unit: "g milk-eq", target: 250, hint: "PHD 250 g (0–500) in milk equivalents — hard cheese ×7, soft cheese ×4, sour cream ×2, yogurt/milk ×1" },
  { id: "plantOils", label: "Unsaturated plant oils", short: "Oils", unit: "g", target: 40, hint: "PHD 40 g (20–80) — seed, olive, sesame, chili oil" },
  { id: "tubers", label: "Starchy roots & tubers", short: "Tubers", unit: "g", target: 50, hint: "PHD 50 g (0–100) — the one restricted plant food" },
];

/* Capped groups — daily ceilings in grams (range tops of PHD 2.0).
   `from` points at the promote-group field the amount is read from, so
   dairy, plant oils and tubers are entered once and both credited and capped.
   Sodium is excluded by design. */
export const CAPS = [
  { id: "redMeat", label: "Red meat", cap: 30, hint: "0–30 g/day (≈200 g/wk)" },
  { id: "poultry", label: "Poultry", cap: 60, hint: "0–60 g/day" },
  { id: "fish", label: "Fish & shellfish", cap: 100, hint: "0–100 g/day" },
  { id: "eggs", label: "Eggs", short: "Eggs", cap: 25, hint: "0–25 g/day" },
  { id: "dairyCap", label: "Dairy", short: "Dairy", cap: 500, hint: "0–500 g milk-eq/day", from: "dairy" },
  { id: "plantOilsCap", label: "Plant oils (ceiling)", cap: 80, hint: "0–80 g/day", from: "plantOils" },
  { id: "tubersCap", label: "Starchy roots & tubers", short: "Tubers", cap: 100, hint: "0–100 g/day", from: "tubers" },
  { id: "addedSugar", label: "Added sugar", short: "Sugar", cap: 60, hint: "≤60 g/day" },
  { id: "animalTropFat", label: "Animal / tropical fat", short: "Sat fat", cap: 12, hint: "butter, ghee, palm, coconut" },
  { id: "ultraProcessed", label: "Ultra-processed foods", short: "UPF", cap: 250,
    hint: "≈20% of energy — a working number, not a Commission figure" },
];

/* Approximate energy densities (kcal/g, as eaten). The promote groups price
   displacement inside headroom; the rest are here only so a dish's entered
   grams can be totalled into tracked energy. All are rough central values —
   good enough to tell a 300 kcal entry from a 900 kcal one, not a nutrition
   label. */
export const KCAL_PER_G = {
  // promote groups — these feed the headroom displacement term
  wholeGrains: 1.3, legumes: 1.15, vegetables: 0.35,
  fruits: 0.6, nuts: 6.0, dairy: 0.7, plantOils: 8.8, tubers: 0.9,
  // bridge foods
  refinedPasta: 1.6, fieldRoast: 2.2, beyond: 2.5,
  // capped groups entered on their own
  redMeat: 2.5, poultry: 1.9, fish: 1.6, eggs: 1.45,
  addedSugar: 4.0, animalTropFat: 8.0, ultraProcessed: 4.0,
};

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

/* Graded cutoffs for the limited groups in the adapted ELI score. */
export const ELI_LIMITED = [
  { id: "redMeat", target: 15, upper: 30 },
  { id: "poultry", target: 30, upper: 60 },
  { id: "fish", target: 30, upper: 100 },
  { id: "eggs", target: 15, upper: 25 },
  { id: "dairy", target: 250, upper: 500 },
  { id: "tubers", target: 50, upper: 100 },
  { id: "addedSugar", target: 30, upper: 60 },
  { id: "animalTropFat", target: 6, upper: 12 },
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

/* Groups that appear in the profile carry a ramp hue; the uncharted meat
   ceilings stay neutral wherever they show up in the editor. */
const BAR_COLORS = Object.fromEntries(
  [...POSITIVE_BARS, ...NEGATIVE_BARS].map((g) => [g.id, g.color])
);
export const barColor = (id) => BAR_COLORS[id] || T.muted;

/* Every composition field exactly once, in the order they stack in the
   tracked-energy bar: what a dish delivers, then the bridge foods, then what
   it spends against ceilings. Capped groups read through `from`, so dairy,
   tubers and plant oils are not counted twice. */
export const ENERGY_GROUPS = [
  ...POSITIVE_BARS.map((g) => ({ id: g.id, label: g.label, color: g.color })),
  ...BRIDGE.map((b) => ({ id: b.id, label: b.label, color: NEUTRAL.bridge })),
  ...NEGATIVE_BARS.map((c) => ({ id: c.from || c.id, label: c.label, color: c.color })),
  ...CAPS.filter((c) => ["redMeat", "poultry", "fish"].includes(c.id))
    .map((c) => ({ id: c.id, label: c.label, color: NEUTRAL.meat })),
];

export const EMPTY = {
  wholeGrains: 0, legumes: 0, vegetables: 0, fruits: 0, nuts: 0, dairy: 0,
  plantOils: 0, tubers: 0,
  refinedPasta: 0, fieldRoast: 0, beyond: 0,
  redMeat: 0, poultry: 0, fish: 0, eggs: 0, addedSugar: 0, animalTropFat: 0, ultraProcessed: 0,
};

/* Completeness weights are gram-proportional for the emphasised groups.
   Dairy and tubers default to 0 — you cannot earn adherence by eating
   more of them. Their ceilings still bind in headroom. */
export const DEFAULT_WEIGHTS = Object.fromEntries(
  PROMOTE.map((g) => [
    g.id,
    g.id === "dairy" || g.id === "tubers" ? 0 : +(g.target / 375).toFixed(2),
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
    note: "Misir wot, kik alicha, shiro, gomen and tikil gomen on teff injera. One share of a restaurant platter split two ways, at 2.5 rounds of injera between them.",
    comp: { ...EMPTY, wholeGrains: 240, legumes: 225, vegetables: 115, plantOils: 22, tubers: 25 },
  },
  {
    id: "puttanesca", source: "home", name: "Field Roast puttanesca",
    note: "Semolina pasta, Italian Field Roast, tomatoes, onion, capers, olives, Calabrian chili, parmesan.",
    comp: { ...EMPTY, vegetables: 235, dairy: 10, refinedPasta: 270, fieldRoast: 92, plantOils: 15 },
  },
  {
    id: "sundubu", source: "restaurant", name: "Sundubu jjigae",
    note: "Soft tofu, kimchi and vegetables, no egg. White rice alongside is inert.",
    comp: { ...EMPTY, legumes: 300, vegetables: 110, plantOils: 12 },
  },
  {
    id: "mapo", source: "home", name: "Vegetarian mapo tofu",
    note: "Tofu, doubanjiang, scallion, sweet peas, Beyond crumbles in place of pork. White rice alongside is inert.",
    comp: { ...EMPTY, legumes: 200, vegetables: 60, beyond: 57, plantOils: 15 },
  },
  {
    id: "chili", source: "home", name: "Beyond & three-bean chili",
    note: "Beyond, three beans, hominy, tomatoes, tomatillos, chipotle, green chiles, jalapeño, bell pepper and corn. Sour cream and cheddar toppings ≈ 200 g milk-eq.",
    comp: { ...EMPTY, legumes: 130, wholeGrains: 65, vegetables: 300, dairy: 200, beyond: 113, plantOils: 8 },
  },
  {
    id: "gochujangTofu", source: "home", name: "Gochujang crispy tofu bowl",
    note: "Crisped tofu in potato starch, gochujang-soy glaze, dressed broccoli, sesame seeds. White rice underneath is inert.",
    comp: { ...EMPTY, legumes: 175, vegetables: 200, nuts: 5, addedSugar: 12, plantOils: 12 },
  },
  {
    id: "pho", source: "restaurant", name: "Veggie pho with tofu",
    note: "Veggie broth, tofu, straw mushrooms, bean sprouts and herbs. Rice noodles are inert — they lack pasta's gluten-starch matrix, so no bridge credit.",
    comp: { ...EMPTY, legumes: 150, vegetables: 110, addedSugar: 5, plantOils: 3 },
  },
  {
    id: "cashewTofu", source: "restaurant", name: "Cashew tofu stir-fry",
    note: "Tofu, cashews, bell pepper, celery, onion and a soy-based sauce. White rice alongside is inert.",
    comp: { ...EMPTY, legumes: 180, vegetables: 140, nuts: 30, addedSugar: 10, plantOils: 20 },
  },
  {
    id: "vegThali", source: "restaurant", name: "Veg thali with raita",
    note: "Dal, sabzi, aloo, roti and raita, without the white rice side. Roti counts as whole grain, raita as 1× milk-eq dairy.",
    comp: { ...EMPTY, legumes: 150, wholeGrains: 90, vegetables: 110, tubers: 70, dairy: 80, plantOils: 20 },
  },
  {
    id: "mezze", source: "restaurant", name: "Vegan mezze + falafel",
    note: "Falafel, hummus, mercimek kofte, salad, walnut muhammara and olives. White pita is inert.",
    comp: { ...EMPTY, legumes: 200, vegetables: 110, nuts: 15, plantOils: 28 },
  },
  {
    id: "beanTacos", source: "restaurant", name: "Calabacita tacos + frijoles",
    note: "Three squash tacos with a side of refried beans. Corn tortillas count as whole grain via nixtamalization; crema at ×2 and queso fresco at ×4 come to ≈110 g milk-eq.",
    comp: { ...EMPTY, wholeGrains: 90, legumes: 120, vegetables: 120, dairy: 110, plantOils: 15 },
  },
  {
    id: "cheesePlate", source: "home", name: "Cheese plate",
    note: "Cheese (90 g ≈ 630 g milk-eq), walnuts, grapes and wholegrain crackers.",
    comp: { ...EMPTY, dairy: 630, nuts: 22, fruits: 70, wholeGrains: 40 },
  },
];
