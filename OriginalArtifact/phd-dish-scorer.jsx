import { useMemo, useState } from "react";

/* ---------------------------------------------------------------
   Planetary Plate — scoring dishes against EAT-Lancet 2.0
   Two axes:
     Headroom     — how much of the dish you could eat before a
                    capped food group binds (sodium excluded).
     Completeness — weighted delivery vs. scaled promote-targets.
   Composite = geometric mean (a near-zero on either axis tanks it).
   --------------------------------------------------------------- */

const T = {
  paper: "#F1F3EC",
  panel: "#FAFBF7",
  ink: "#22301F",
  muted: "#6C7A66",
  hair: "#D8DECE",
  green: "#2F7D4E",
  ochre: "#C08A2D",
  red: "#BC4B3C",
};

/* Promote groups — daily targets in grams AS EATEN.
   Grains & legumes converted from PHD dry-weight targets
   (150 g and 75 g dry) at ~2.5× / 2.4× cooked yield. */
const PROMOTE = [
  { id: "wholeGrains", label: "Whole grains", unit: "g cooked", target: 375, hint: "PHD 150 g dry ≈ 375 g cooked" },
  { id: "legumes", label: "Legumes", unit: "g cooked", target: 180, hint: "PHD 75 g dry ≈ 180 g cooked · tofu/tempeh count here at full credit (soy is in the Commission's legume group)" },
  { id: "vegetables", label: "Vegetables", unit: "g", target: 300, hint: "PHD 300 g (200–600)" },
  { id: "fruits", label: "Fruits", unit: "g", target: 200, hint: "PHD 200 g (100–300)" },
  { id: "nuts", label: "Nuts & peanuts", unit: "g", target: 25, hint: "PHD 25 g" },
  { id: "dairy", label: "Dairy", unit: "g milk-eq", target: 250, hint: "PHD 250 g (0–500) in milk equivalents — hard cheese ×7, soft cheese ×4, sour cream ×2, yogurt/milk ×1" },
  { id: "plantOils", label: "Unsaturated plant oils", unit: "g", target: 40, hint: "PHD 40 g (20–80) — seed, olive, sesame, chili oil" },
  { id: "tubers", label: "Starchy roots & tubers", unit: "g", target: 50, hint: "PHD 50 g (0–100) — the one restricted plant food" },
];

/* Capped groups — daily ceilings in grams (range tops of PHD 2.0).
   Sodium deliberately excluded. */
const CAPS = [
  { id: "redMeat", label: "Red meat", cap: 30, hint: "0–30 g/day (≈200 g/wk)" },
  { id: "poultry", label: "Poultry", cap: 60, hint: "0–60 g/day" },
  { id: "fish", label: "Fish & shellfish", cap: 100, hint: "0–100 g/day" },
  { id: "eggs", label: "Eggs", cap: 25, hint: "0–25 g/day" },
  { id: "dairyCap", label: "Dairy", cap: 500, hint: "0–500 g milk-eq/day — hard cheese ×7, soft ×4, sour cream ×2, yogurt/milk ×1", from: "dairy" },
  { id: "plantOilsCap", label: "Plant oils (ceiling)", cap: 80, hint: "upper range 80 g/day", from: "plantOils" },
  { id: "tubersCap", label: "Starchy roots & tubers", cap: 100, hint: "0–100 g/day", from: "tubers" },
  { id: "addedSugar", label: "Added sugar", cap: 60, hint: "≤60 g/day" },
  { id: "animalTropFat", label: "Animal / tropical fat", cap: 12, hint: "butter, ghee, palm, coconut" },
  { id: "ultraProcessed", label: "Ultra-processed foods", cap: 250,
    hint: "INVENTED cap ≈20% of energy — the Commission says limit, gives no number. Beyond counts 80%, Field Roast 50%, automatically" },
];

/* Approximate energy densities (kcal/g, as eaten). Used both to price
   displacement in headroom and to weight completeness. */
const KCAL_PER_G = {
  wholeGrains: 1.3, legumes: 1.15, vegetables: 0.35,
  fruits: 0.6, nuts: 6.0, dairy: 0.7, plantOils: 8.8, tubers: 0.9,
};

/* Default completeness weights are gram-proportional for the
   EMPHASISED groups only. Dairy and tubers default to 0: their PHD
   ranges start at zero and ELI 2.0 classes both as limited groups —
   you can't earn adherence by eating more of them. Their ceilings
   still bind in headroom. Bump their weights up if you personally
   want them encouraged (e.g. dairy for calcium in a fish-free diet). */
const DEFAULT_WEIGHTS = Object.fromEntries(
  PROMOTE.map((g) => [
    g.id,
    g.id === "dairy" || g.id === "tubers" ? 0 : +(g.target / 375).toFixed(2),
  ])
);

const EMPTY = {
  wholeGrains: 0, legumes: 0, vegetables: 0, fruits: 0, nuts: 0, dairy: 0,
  plantOils: 0, tubers: 0,
  refinedPasta: 0, fieldRoast: 0, beyond: 0,
  redMeat: 0, poultry: 0, fish: 0, eggs: 0, addedSugar: 0, animalTropFat: 0, ultraProcessed: 0,
};

/* Bridge foods — inert under strict EAT-Lancet taxonomy, partially
   credited in evidence-adjusted mode:
   - refined pasta: GI ~45–55 vs ~70–90 for white rice/bread (dense
     gluten-starch matrix), but lacks whole-grain fiber → partial
     whole-grain credit
   - Field Roast / seitan: wheat gluten; does legumes' protein-source
     job, none of their fiber or phytochemicals → 0.6
   - Beyond Burger: pea-protein isolate, legume-origin but
     fiber-stripped → 0.7. Current formula uses avocado oil (uncapped).
   Tofu is NOT a bridge food — enter it under legumes at full credit. */
const BRIDGE = [
  { id: "refinedPasta", label: "Refined pasta", unit: "g cooked", creditsTo: "wholeGrains", creditKey: "pastaCredit" },
  { id: "fieldRoast", label: "Field Roast / seitan", unit: "g", creditsTo: "legumes", creditKey: "fieldRoastCredit", upfFraction: 0.5 },
  { id: "beyond", label: "Beyond Burger", unit: "g", creditsTo: "legumes", creditKey: "beyondCredit", upfFraction: 0.8 },
];

/* Composition = grams in one reference portion (default 40% of daily energy). */
const SEED_DISHES = [
  {
    id: "beyaynetu", name: "Beyaynetu (Ethiopian veg combo)",
    note: "Misir wot, kik alicha, shiro, gomen, tikil gomen on teff injera",
    comp: { ...EMPTY, wholeGrains: 300, legumes: 220, vegetables: 200, plantOils: 20, tubers: 40 },
  },
  {
    id: "chana", name: "Chana masala + brown rice",
    note: "Chickpea curry, tomato-onion base",
    comp: { ...EMPTY, wholeGrains: 250, legumes: 200, vegetables: 140, plantOils: 12 },
  },
  {
    id: "puttanesca", name: "Field Roast pasta (family recipe)",
    note: "Per person at 4 servings: semolina pasta, Italian Field Roast, tomatoes, onion, capers, olives, Calabrian chili, parmesan",
    comp: { ...EMPTY, vegetables: 235, dairy: 10, refinedPasta: 270, fieldRoast: 92, plantOils: 15 },
  },
  {
    id: "sundubu", name: "Sundubu jjigae",
    note: "Soft tofu, kimchi & vegetables, no egg. White rice alongside is inert.",
    comp: { ...EMPTY, legumes: 280, vegetables: 160, plantOils: 8 },
  },
  {
    id: "mapo", name: "Vegetarian mapo tofu",
    note: "Tofu, doubanjiang, scallion, sweet peas, optional Beyond crumbles in place of pork. White rice alongside is inert.",
    comp: { ...EMPTY, legumes: 200, vegetables: 60, beyond: 57, plantOils: 15 },
  },
  {
    id: "chili", name: "Family chili (Beyond & three-bean)",
    note: "Per person at 6 servings: Beyond, three beans, hominy, tomatoes, tomatillos, chipotle, green chiles, jalapeño, bell pepper, corn; sour cream & cheddar toppings ≈ 200 g milk-eq",
    comp: { ...EMPTY, legumes: 130, wholeGrains: 65, vegetables: 300, dairy: 200, beyond: 113, plantOils: 8 },
  },
  {
    id: "gochujangTofu", name: "Gochujang crispy tofu bowl",
    note: "Aaron & Claire base recipe with extra broccoli. Per person: crisped tofu (potato starch), gochujang-soy-corn syrup glaze, dressed broccoli, sesame seeds. White rice underneath is inert.",
    comp: { ...EMPTY, legumes: 175, vegetables: 200, nuts: 5, addedSugar: 12, plantOils: 12 },
  },
  {
    id: "pho", name: "Veggie pho with tofu",
    note: "Veggie broth, tofu, straw mushrooms, bean sprouts, herbs, the fixins. Rice noodles are inert — they lack pasta's gluten-starch matrix, so no bridge credit.",
    comp: { ...EMPTY, legumes: 150, vegetables: 140, addedSugar: 5, plantOils: 3 },
  },
  {
    id: "cashewTofu", name: "Cashew tofu stir-fry",
    note: "Tofu, cashews, bell pepper, celery, onion, soy-based sauce. White rice alongside is inert.",
    comp: { ...EMPTY, legumes: 160, vegetables: 130, nuts: 35, addedSugar: 7, plantOils: 12 },
  },
  {
    id: "vegThali", name: "Veg thali with raita (Fusion Bistro)",
    note: "Weekdays only. Dal, sabzi, aloo, roti, raita; skip the white rice side. Roti counts as whole grain, raita as 1× milk-eq dairy.",
    comp: { ...EMPTY, legumes: 150, wholeGrains: 100, vegetables: 150, tubers: 60, dairy: 80, plantOils: 15 },
  },
  {
    id: "mezze", name: "Vegan mezze + falafel (Cafe Paloma)",
    note: "Falafel, hummus, mercimek kofte, salad, walnut muhammara, olives. White pita is inert.",
    comp: { ...EMPTY, legumes: 180, vegetables: 120, nuts: 10, plantOils: 20 },
  },
  {
    id: "beanTacos", name: "Calabacita tacos + frijoles (La Llorona)",
    note: "Squash tacos on corn tortillas (whole grain via nixtamalization) with a side of refried beans; crema and feta count as dairy.",
    comp: { ...EMPTY, wholeGrains: 90, legumes: 100, vegetables: 120, dairy: 45, plantOils: 12 },
  },
  {
    id: "salmonBowl", name: "Salmon teriyaki bowl (white rice)",
    note: "Refined rice contributes no whole-grain credit",
    comp: { ...EMPTY, fish: 140, vegetables: 110, addedSugar: 14, plantOils: 8 },
  },
  {
    id: "pizza", name: "Margherita pizza (12\")",
    note: "Refined crust, mozzarella (130 g ≈ 520 g milk-eq), tomato",
    comp: { ...EMPTY, dairy: 520, vegetables: 90, animalTropFat: 4, plantOils: 10 },
  },
  {
    id: "cheesePlate", name: "Cheese plate",
    note: "Cheese (90 g ≈ 630 g milk-eq), walnuts, grapes, wholegrain crackers",
    comp: { ...EMPTY, dairy: 630, nuts: 22, fruits: 70, wholeGrains: 40 },
  },
];

const DAILY_KCAL = 2400; // PHD 2.0 reference energy intake

function scoreDish(comp, settings, weights) {
  const P = settings.portionPct / 100;

  // Bridge credits (evidence-adjusted mode only) apply to both
  // completeness and displacement accounting.
  const bridged = { ...comp };
  if (settings.mode === "evidence") {
    for (const b of BRIDGE) {
      bridged[b.creditsTo] = (bridged[b.creditsTo] || 0) + (settings[b.creditKey] || 0) * (comp[b.id] || 0);
    }
  }

  // Headroom: largest share f of the day's energy this dish can occupy
  // while a full-target day is still possible. Two constraint families:
  //   1. Caps — eating f of the day means f/P portions; no capped group
  //      may exceed its daily ceiling.
  //   2. Displacement — the calories left over, (1-f)·DAILY_KCAL, must be
  //      enough to buy every promote-target gram the dish didn't deliver,
  //      priced at KCAL_PER_G.
  const check = (f) => {
    const upf = (comp.ultraProcessed || 0) +
      BRIDGE.reduce((s, b) => s + (b.upfFraction || 0) * (comp[b.id] || 0), 0);
    for (const c of CAPS) {
      const amt = c.id === "ultraProcessed" ? upf : (c.from ? comp[c.from] : comp[c.id]);
      if (amt > 0 && (f / P) * amt > c.cap + 1e-9) return { ok: false, why: c.label };
    }
    let need = 0;
    for (const g of PROMOTE) {
      if ((weights[g.id] ?? 0) <= 0) continue; // zero-weighted groups are optional, not required in a full-target day
      need += Math.max(g.target - (f / P) * (bridged[g.id] || 0), 0) * KCAL_PER_G[g.id];
    }
    if (need > (1 - f) * DAILY_KCAL + 1e-6) return { ok: false, why: "room for missing groups" };
    return { ok: true, why: null };
  };

  let headroom, binding;
  if (check(1).ok) {
    headroom = 1; binding = null;
  } else {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (check(mid).ok) lo = mid; else hi = mid;
    }
    headroom = lo;
    binding = check(Math.min(headroom + 0.005, 1)).why;
  }

  // Completeness: weighted mean of min(delivered / scaled target, 1)
  let wsum = 0, acc = 0;
  const parts = {};
  for (const g of PROMOTE) {
    const w = weights[g.id] ?? 0;
    const ratio = Math.min(bridged[g.id] / (g.target * P), 1);
    parts[g.id] = ratio;
    acc += w * ratio;
    wsum += w;
  }
  const completeness = wsum > 0 ? acc / wsum : 0;
  const composite = Math.sqrt(Math.max(headroom, 0) * Math.max(completeness, 0));
  const eli = scoreEli(comp, bridged, P);
  return { headroom, completeness, composite, binding, parts, eli };
}

/* ELI 2.0–style adherence score (ADAPTED, not the official index).
   Follows the published architecture — graded 0–3 points per food
   group, emphasised groups reward intake, limited groups reward
   restraint, with a >150%-of-upper penalty band — but with cutoffs
   reconstructed from PHD 2.0 targets/ranges (the paper's exact table
   is paywalled), per-dish scaling instead of whole-diet intake, and
   sodium omitted. 12 groups × 3 pts = 36; reported as a percentage. */
const ELI_LIMITED = [
  { id: "redMeat", target: 15, upper: 30 },
  { id: "poultry", target: 30, upper: 60 },
  { id: "fish", target: 30, upper: 100 },
  { id: "eggs", target: 15, upper: 25 },
  { id: "dairy", target: 250, upper: 500 },
  { id: "tubers", target: 50, upper: 100 },
  { id: "addedSugar", target: 30, upper: 60 },
  { id: "animalTropFat", target: 6, upper: 12 },
];
function scoreEli(comp, bridged, P) {
  let pts = 0, max = 0;
  for (const g of PROMOTE.filter((x) => x.id !== "dairy" && x.id !== "tubers")) {
    const daily = (bridged[g.id] || 0) / P;
    pts += daily >= g.target ? 3 : daily >= (2 / 3) * g.target ? 2 : daily >= (1 / 3) * g.target ? 1 : 0;
    max += 3;
  }
  for (const l of ELI_LIMITED) {
    const daily = (comp[l.id] || 0) / P;
    pts += daily <= l.target ? 3 : daily <= l.upper ? 2 : daily <= 1.5 * l.upper ? 1 : 0;
    max += 3;
  }
  return pts / max;
}

/* Color bands calibrated to the achievable range, not 0–1. With equal
   weights and displacement-aware headroom, no real entrée carries
   fruit + nuts + dairy, so the practical composite ceiling is ~0.70 —
   scores are batting averages, not percentages. */
function scoreColor(s) {
  if (s >= 0.55) return T.green;
  if (s >= 0.35) return T.ochre;
  return T.red;
}

function fmtPct(x) { return Math.round(x * 100) + "%"; }

/* ---------- Scatter field with geometric-mean contours ---------- */
function Field({ scored, selectedId, onSelect }) {
  const W = 520, H = 420, pad = { l: 46, r: 16, t: 18, b: 42 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = (h) => pad.l + h * iw;
  const Y = (c) => pad.t + (1 - c) * ih;

  const contours = [0.3, 0.5, 0.7, 0.9].map((k) => {
    const pts = [];
    for (let x = k * k; x <= 1.001; x += 0.01) {
      const y = (k * k) / x;
      if (y <= 1.001) pts.push(`${X(Math.min(x, 1))},${Y(Math.min(y, 1))}`);
    }
    return { k, d: "M" + pts.join(" L") };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
      aria-label="Dishes plotted by headroom and completeness">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={X(t)} y1={pad.t} x2={X(t)} y2={pad.t + ih} stroke={T.hair} strokeWidth="1" />
          <line x1={pad.l} y1={Y(t)} x2={pad.l + iw} y2={Y(t)} stroke={T.hair} strokeWidth="1" />
          <text x={X(t)} y={H - 22} textAnchor="middle" fontSize="10" fill={T.muted} fontFamily="'IBM Plex Mono', monospace">{t}</text>
          <text x={pad.l - 8} y={Y(t) + 3} textAnchor="end" fontSize="10" fill={T.muted} fontFamily="'IBM Plex Mono', monospace">{t}</text>
        </g>
      ))}
      {contours.map((c) => (
        <g key={c.k}>
          <path d={c.d} fill="none" stroke={T.muted} strokeWidth="1" strokeDasharray="3 4" opacity="0.55" />
          <text x={X(1) - 4} y={Y(c.k * c.k) - 5} textAnchor="end" fontSize="10" fill={T.muted}
            fontFamily="'IBM Plex Mono', monospace">composite {c.k}</text>
        </g>
      ))}
      <text x={pad.l + iw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill={T.ink}
        fontFamily="'Archivo', sans-serif" fontWeight="600">Headroom → how much fits in a full-target day</text>
      <text x={13} y={pad.t + ih / 2} textAnchor="middle" fontSize="11" fill={T.ink}
        fontFamily="'Archivo', sans-serif" fontWeight="600"
        transform={`rotate(-90 13 ${pad.t + ih / 2})`}>Completeness → how much it delivers</text>

      {scored.map((d) => {
        const sel = d.id === selectedId;
        return (
          <g key={d.id} onClick={() => onSelect(d.id)} style={{ cursor: "pointer" }}>
            <circle cx={X(d.score.headroom)} cy={Y(d.score.completeness)}
              r={sel ? 9 : 6.5}
              fill={scoreColor(d.score.composite)}
              stroke={sel ? T.ink : scoreColor(d.score.composite)}
              strokeWidth={sel ? 2.5 : 1.5} />
            {sel && (
              <text x={X(d.score.headroom)} y={Y(d.score.completeness) - 14} textAnchor="middle"
                fontSize="11" fontWeight="700" fill={T.ink} fontFamily="'Archivo', sans-serif">
                {d.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Composite vs ELI comparison plot ---------- */
function EliPlot({ scored, selectedId, onSelect }) {
  const W = 520, H = 420, pad = { l: 46, r: 16, t: 18, b: 42 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = (v) => pad.l + v * iw;
  const Y = (v) => pad.t + (1 - v) * ih;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img"
      aria-label="Dishes plotted by composite score against ELI-style adherence">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={X(t)} y1={pad.t} x2={X(t)} y2={pad.t + ih} stroke={T.hair} strokeWidth="1" />
          <line x1={pad.l} y1={Y(t)} x2={pad.l + iw} y2={Y(t)} stroke={T.hair} strokeWidth="1" />
          <text x={X(t)} y={H - 22} textAnchor="middle" fontSize="10" fill={T.muted} fontFamily="'IBM Plex Mono', monospace">{t}</text>
          <text x={pad.l - 8} y={Y(t) + 3} textAnchor="end" fontSize="10" fill={T.muted} fontFamily="'IBM Plex Mono', monospace">{t}</text>
        </g>
      ))}
      {[0.3, 0.5, 0.7, 0.9].map((k) => {
        const pts = [];
        for (let x = k * k; x <= 1.001; x += 0.01) {
          const y = (k * k) / x;
          if (y <= 1.001) pts.push(`${X(Math.min(x, 1))},${Y(Math.min(y, 1))}`);
        }
        return (
          <g key={k}>
            <path d={"M" + pts.join(" L")} fill="none" stroke={T.muted} strokeWidth="1" strokeDasharray="3 4" opacity="0.55" />
            <text x={X(1) - 4} y={Y(k * k) - 5} textAnchor="end" fontSize="10" fill={T.muted}
              fontFamily="'IBM Plex Mono', monospace">combined {k}</text>
          </g>
        );
      })}
      <text x={pad.l + iw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill={T.ink}
        fontFamily="'Archivo', sans-serif" fontWeight="600">Composite (headroom × completeness)</text>
      <text x={13} y={pad.t + ih / 2} textAnchor="middle" fontSize="11" fill={T.ink}
        fontFamily="'Archivo', sans-serif" fontWeight="600"
        transform={`rotate(-90 13 ${pad.t + ih / 2})`}>ELI≈ (adapted)</text>
      {scored.map((d) => {
        const sel = d.id === selectedId;
        return (
          <g key={d.id} onClick={() => onSelect(d.id)} style={{ cursor: "pointer" }}>
            <circle cx={X(d.score.composite)} cy={Y(d.score.eli)}
              r={sel ? 9 : 6.5}
              fill={scoreColor(d.score.composite)}
              stroke={sel ? T.ink : scoreColor(d.score.composite)}
              strokeWidth={sel ? 2.5 : 1.5} />
            {sel && (
              <text x={X(d.score.composite)} y={Y(d.score.eli) - 14} textAnchor="middle"
                fontSize="11" fontWeight="700" fill={T.ink} fontFamily="'Archivo', sans-serif">
                {d.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------ UI ------------------------------ */
export default function App() {
  const [dishes, setDishes] = useState(SEED_DISHES);
  const [selectedId, setSelectedId] = useState("beyaynetu");
  const [settings, setSettings] = useState({ portionPct: 40, mode: "evidence", pastaCredit: 0.35, fieldRoastCredit: 0.6, beyondCredit: 0.7 });
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [plot, setPlot] = useState("field");

  const scored = useMemo(
    () => dishes.map((d) => ({ ...d, score: scoreDish(d.comp, settings, weights) }))
      .sort((a, b) => b.score.composite - a.score.composite),
    [dishes, settings, weights]
  );

  const visible = scored.filter(
    (d) => d.name.toLowerCase().includes(query.toLowerCase())
  );
  const selected = scored.find((d) => d.id === selectedId) || scored[0];

  const updateComp = (dishId, key, val) => {
    setDishes((ds) => ds.map((d) =>
      d.id === dishId ? { ...d, comp: { ...d.comp, [key]: Math.max(0, Number(val) || 0) } } : d
    ));
  };

  const addDish = () => {
    const id = "dish" + Date.now();
    setDishes((ds) => [...ds, { id, name: "New dish", note: "", comp: { ...EMPTY } }]);
    setSelectedId(id);
  };

  const label = { fontSize: 11, color: T.muted, fontFamily: "'Archivo', sans-serif", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" };
  const input = {
    width: 64, padding: "4px 6px", border: `1px solid ${T.hair}`, borderRadius: 4,
    background: "#fff", color: T.ink, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
  };

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Archivo', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Archivo:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, button:focus { outline: 2px solid ${T.green}; outline-offset: 1px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <header style={{ padding: "26px 26px 14px", borderBottom: `1px solid ${T.hair}`, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 14 }}>
        <h1 style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 34, letterSpacing: "-0.01em" }}>
          Planetary Plate
        </h1>
        <span style={{ fontSize: 13, color: T.muted }}>
          Dishes scored against EAT-Lancet 2.0 · headroom × completeness · sodium excluded by design
        </span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 340px) 1fr", gap: 0, alignItems: "start" }}>
        {/* ---------- left: dish list ---------- */}
        <aside style={{ borderRight: `1px solid ${T.hair}`, padding: 18, minHeight: "60vh" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes"
              style={{ ...input, width: "100%", padding: "8px 10px", fontSize: 13, fontFamily: "'Archivo', sans-serif" }} />
            <button onClick={addDish} title="Add a dish"
              style={{ border: `1px solid ${T.ink}`, background: T.ink, color: T.paper, borderRadius: 4, padding: "0 12px", cursor: "pointer", fontWeight: 700 }}>+</button>
          </div>

          {visible.map((d) => {
            const sel = d.id === selected?.id;
            return (
              <button key={d.id} onClick={() => setSelectedId(d.id)}
                style={{
                  display: "block", width: "100%", textAlign: "left", marginBottom: 6, padding: "9px 11px",
                  borderRadius: 6, cursor: "pointer",
                  border: `1px solid ${sel ? T.ink : T.hair}`,
                  background: sel ? "#fff" : T.panel,
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: scoreColor(d.score.composite) }}>
                    {fmtPct(d.score.composite)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>
                  H {fmtPct(d.score.headroom)} · C {fmtPct(d.score.completeness)}
                </div>
              </button>
            );
          })}
        </aside>

        {/* ---------- right: field + detail ---------- */}
        <main style={{ padding: 18, display: "grid", gap: 18 }}>
          <section style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[
                { id: "field", name: "Headroom × completeness" },
                { id: "eli", name: "Composite vs ELI" },
              ].map((p) => (
                <button key={p.id} onClick={() => setPlot(p.id)}
                  style={{
                    padding: "6px 11px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    border: `1px solid ${plot === p.id ? T.ink : T.hair}`,
                    background: plot === p.id ? T.ink : "#fff",
                    color: plot === p.id ? T.paper : T.ink,
                  }}>{p.name}</button>
              ))}
            </div>
            {plot === "field" ? (
              <>
                <Field scored={scored} selectedId={selected?.id} onSelect={setSelectedId} />
                <p style={{ margin: "6px 4px 0", fontSize: 12, color: T.muted }}>
                  Dashed curves are lines of equal composite score (geometric mean). Headroom binds either on a hard
                  cap (fish, eggs, sugar…) or on displacement — a dish that delivers little must leave room in the
                  day for everything it's missing.
                </p>
              </>
            ) : (
              <>
                <EliPlot scored={scored} selectedId={selected?.id} onSelect={setSelectedId} />
                <p style={{ margin: "6px 4px 0", fontSize: 12, color: T.muted }}>
                  Dashed curves are lines of equal combined score — the geometric mean of the composite and the
                  ELI-style score, same construction as the headroom × completeness field. Dishes further toward
                  the upper right score well by both readings.
                </p>
              </>
            )}
          </section>

          {selected && (
            <section style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 8, padding: 18 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline", marginBottom: 4 }}>
                <input value={selected.name}
                  onChange={(e) => setDishes((ds) => ds.map((d) => d.id === selected.id ? { ...d, name: e.target.value } : d))}
                  style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, border: "none", background: "transparent", color: T.ink, width: "min(420px, 100%)" }} />
                <div style={{ display: "flex", gap: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}>
                  <span>H <b style={{ color: T.ink }}>{fmtPct(selected.score.headroom)}</b></span>
                  <span>C <b style={{ color: T.ink }}>{fmtPct(selected.score.completeness)}</b></span>
                  <span style={{ color: scoreColor(selected.score.composite), fontWeight: 700 }}>
                    ✦ {fmtPct(selected.score.composite)}
                  </span>
                  <span title="ELI 2.0–style graded adherence (adapted: per-dish, no sodium, reconstructed cutoffs)" style={{ color: T.muted }}>
                    ELI≈ <b style={{ color: T.ink }}>{fmtPct(selected.score.eli)}</b>
                  </span>
                </div>
              </div>
              {selected.note && <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted }}>{selected.note}</p>}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>Delivers (per portion, {settings.portionPct}% of day)</div>
                  {PROMOTE.filter((g) => g.id !== "dairy" && g.id !== "tubers").map((g) => (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <input type="number" min="0" value={selected.comp[g.id]}
                        onChange={(e) => updateComp(selected.id, g.id, e.target.value)} style={input} aria-label={g.label} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{g.label} <span style={{ color: T.muted, fontSize: 11 }}>({g.unit})</span></div>
                        <div style={{ height: 4, background: T.hair, borderRadius: 2, marginTop: 3 }}>
                          <div style={{ height: 4, width: fmtPct(selected.score.parts[g.id]), background: T.green, borderRadius: 2 }} />
                        </div>
                      </div>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.muted, width: 36, textAlign: "right" }}>
                        {fmtPct(selected.score.parts[g.id])}
                      </span>
                    </div>
                  ))}
                  <div style={{ ...label, margin: "12px 0 8px" }}>Bridge foods</div>
                  {BRIDGE.map((b) => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <input type="number" min="0" value={selected.comp[b.id]}
                        onChange={(e) => updateComp(selected.id, b.id, e.target.value)} style={input} aria-label={b.label} />
                      <div style={{ flex: 1, fontSize: 13 }}>
                        {b.label} <span style={{ color: T.muted, fontSize: 11 }}>({b.unit})</span>
                        <div style={{ fontSize: 11, color: settings.mode === "evidence" ? T.green : T.muted }}>
                          {settings.mode === "evidence"
                            ? `credits ${Math.round((settings[b.creditKey] || 0) * 100)}% toward ${b.creditsTo === "wholeGrains" ? "whole grains" : "legumes"}`
                            : "inert in strict mode"}
                          {b.upfFraction ? ` · counts ${Math.round(b.upfFraction * 100)}% toward the ultra-processed cap` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>Capped groups (g per portion)</div>
                  {CAPS.filter((c) => !c.from || c.id === "dairyCap" || c.id === "tubersCap").map((c) => {
                    const field = c.from || c.id;
                    const base = selected.comp[field] || 0;
                    const amt = c.id === "ultraProcessed"
                      ? base + BRIDGE.reduce((s, b) => s + (b.upfFraction || 0) * (selected.comp[b.id] || 0), 0)
                      : base;
                    const ratio = Math.min(amt / (c.cap * (settings.portionPct / 100)), 1);
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input type="number" min="0" value={selected.comp[field]}
                          onChange={(e) => updateComp(selected.id, field, e.target.value)} style={input} aria-label={c.label} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13 }}>
                            {c.label}
                            {c.id !== "ultraProcessed" && <span style={{ color: T.muted, fontSize: 11 }}> {c.hint}</span>}
                          </div>
                          <div style={{ height: 4, background: T.hair, borderRadius: 2, marginTop: 3 }}>
                            <div style={{ height: 4, width: fmtPct(ratio), background: T.ochre, borderRadius: 2 }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.muted, width: 36, textAlign: "right" }}>
                          {fmtPct(ratio)}
                        </span>
                      </div>
                    );
                  })}
                  <p style={{ fontSize: 11, color: T.muted, marginTop: 10 }}>
                    White rice and bread are always inert — neither credited nor capped. Pasta, Field Roast and
                    Beyond are bridge foods: inert in strict mode, partially credited in evidence-adjusted mode.
                    Tofu isn't a bridge — enter it under legumes at full credit.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section style={{ background: T.panel, border: `1px solid ${T.hair}`, borderRadius: 8 }}>
            <button onClick={() => setShowSettings((s) => !s)}
              style={{ width: "100%", textAlign: "left", padding: "12px 18px", background: "transparent", border: "none", cursor: "pointer", ...label, fontSize: 12 }}>
              {showSettings ? "▾" : "▸"} Method settings — scoring mode, portion scaling & weights
            </button>
            {showSettings && (
              <div style={{ padding: "0 18px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>Scoring mode</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[
                      { id: "strict", name: "Strict EAT-Lancet" },
                      { id: "evidence", name: "Evidence-adjusted" },
                    ].map((m) => (
                      <button key={m.id} onClick={() => setSettings((s) => ({ ...s, mode: m.id }))}
                        style={{
                          padding: "7px 12px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600,
                          border: `1px solid ${settings.mode === m.id ? T.ink : T.hair}`,
                          background: settings.mode === m.id ? T.ink : "#fff",
                          color: settings.mode === m.id ? T.paper : T.ink,
                        }}>{m.name}</button>
                    ))}
                  </div>
                  {settings.mode === "evidence" && (
                    <>
                      {BRIDGE.map((b) => (
                        <div key={b.creditKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <input type="number" min="0" max="1" step="0.05" value={settings[b.creditKey]}
                            onChange={(e) => setSettings((s) => ({ ...s, [b.creditKey]: Math.max(0, Number(e.target.value) || 0) }))}
                            style={input} aria-label={`${b.label} credit`} />
                          <span style={{ fontSize: 13 }}>{b.label} → {b.creditsTo === "wholeGrains" ? "whole grains" : "legumes"}</span>
                        </div>
                      ))}
                      <p style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
                        Judgment dials, not measurements. Pasta 0.35: low-GI behavior earned, whole-grain fiber not.
                        Field Roast 0.6: wheat gluten does legumes' protein job, none of their fiber. Beyond 0.7:
                        pea-derived, so legume-origin, but the isolate strips fiber. Tofu needs no dial — it enters
                        under legumes at full credit.
                      </p>
                    </>
                  )}
                  <div style={{ ...label, margin: "14px 0 8px" }}>Reference portion — {settings.portionPct}% of daily energy</div>
                  <input type="range" min="20" max="60" step="5" value={settings.portionPct}
                    onChange={(e) => setSettings((s) => ({ ...s, portionPct: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: T.green }} />
                  <p style={{ fontSize: 12, color: T.muted }}>
                    Daily targets and caps are scaled by this fraction before scoring, so portion-size guesswork cancels out of comparisons.
                  </p>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>Completeness weights</div>
                  {PROMOTE.map((g) => (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <input type="number" min="0" max="1" step="0.05" value={weights[g.id]}
                        onChange={(e) => setWeights((w) => ({ ...w, [g.id]: Math.max(0, Number(e.target.value) || 0) }))}
                        style={input} aria-label={`Weight for ${g.label}`} />
                      <span style={{ fontSize: 13 }}>{g.label}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>{g.hint}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
                    Gram-proportional weights for emphasised groups; dairy and tubers default to 0 because their
                    PHD ranges start at zero and ELI 2.0 classes them as limited — ceilings still bind. A weight
                    of 0 also removes a group from headroom's required-day accounting.
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
