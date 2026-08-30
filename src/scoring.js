/* Scoring dishes against EAT-Lancet 2.0 on two axes:
     Headroom     — how much of the dish you could eat before a capped
                    food group binds (sodium excluded).
     Completeness — weighted delivery vs. scaled promote-targets.
   Composite = geometric mean, so a near-zero on either axis tanks it. */

import {
  PROMOTE, CAPS, BRIDGE, KCAL_PER_G, ELI_LIMITED, EMPHASISED, ENERGY_GROUPS,
  DAILY_KCAL, TARGET_DAY_KCAL,
} from "./data.js";

/* Total energy in one portion, from the grams entered. Each composition field
   is priced once — bridge credits are deliberately not applied here, since a
   bridge food's own grams already carry its calories. */
export function trackedKcal(comp) {
  return ENERGY_GROUPS.reduce((sum, g) => sum + (comp[g.id] || 0) * KCAL_PER_G[g.id], 0);
}

/* How much of a day this portion is. In auto mode the dish measures itself:
   its tracked energy over the cost of a full target day, so the targets and
   ceilings it is scored against always match the size actually entered. The
   floor keeps an empty dish from dividing by zero; the ceiling stops a single
   entry from claiming more than a whole day. */
export const MIN_PORTION = 0.05;
export const MAX_PORTION = 1;

export function portionShare(comp, settings) {
  if (settings.portionMode === "fixed") return settings.portionPct / 100;
  const raw = trackedKcal(comp) / TARGET_DAY_KCAL;
  return Math.min(Math.max(raw, MIN_PORTION), MAX_PORTION);
}

/* Bridge-food credits (evidence-adjusted mode only) apply to both
   completeness and displacement accounting. */
function applyBridgeCredits(comp, settings) {
  const bridged = { ...comp };
  if (settings.mode !== "evidence") return bridged;
  for (const b of BRIDGE) {
    bridged[b.creditsTo] = (bridged[b.creditsTo] || 0) + (settings[b.creditKey] || 0) * (comp[b.id] || 0);
  }
  return bridged;
}

/* Grams counting toward the ultra-processed ceiling: what was entered
   directly, plus each bridge food's UPF fraction. */
export function upfGrams(comp) {
  return (comp.ultraProcessed || 0) +
    BRIDGE.reduce((s, b) => s + (b.upfFraction || 0) * (comp[b.id] || 0), 0);
}

/* Amount of a capped group in one portion, following `from` indirection. */
export function cappedAmount(comp, cap) {
  if (cap.id === "ultraProcessed") return upfGrams(comp);
  return comp[cap.from || cap.id] || 0;
}

export function scoreDish(comp, settings, weights) {
  const P = portionShare(comp, settings);
  const bridged = applyBridgeCredits(comp, settings);

  /* Headroom: the largest share f of the day's energy this dish can occupy
     while a full-target day is still possible. Two constraint families:
       1. Caps — eating f of the day means f/P portions; no capped group
          may exceed its daily ceiling.
       2. Displacement — the calories left over, (1-f)·DAILY_KCAL, must be
          enough to buy every promote-target gram the dish did not deliver,
          priced at KCAL_PER_G. */
  const check = (f) => {
    for (const c of CAPS) {
      const amt = cappedAmount(comp, c);
      if (amt > 0 && (f / P) * amt > c.cap + 1e-9) return { ok: false, why: c.label };
    }
    let need = 0;
    for (const g of PROMOTE) {
      // Zero-weighted groups are optional, not required in a full-target day.
      if ((weights[g.id] ?? 0) <= 0) continue;
      need += Math.max(g.target - (f / P) * (bridged[g.id] || 0), 0) * KCAL_PER_G[g.id];
    }
    if (need > (1 - f) * DAILY_KCAL + 1e-6) return { ok: false, why: "room for the missing groups" };
    return { ok: true, why: null };
  };

  let headroom, binding;
  if (check(1).ok) {
    headroom = 1;
    binding = null;
  } else {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (check(mid).ok) lo = mid; else hi = mid;
    }
    headroom = lo;
    binding = check(Math.min(headroom + 0.005, 1)).why;
  }

  // Completeness: weighted mean of min(delivered / scaled target, 1).
  let wsum = 0, acc = 0;
  const parts = {};
  for (const g of PROMOTE) {
    const w = weights[g.id] ?? 0;
    const ratio = Math.min((bridged[g.id] || 0) / (g.target * P), 1);
    parts[g.id] = ratio;
    acc += w * ratio;
    wsum += w;
  }
  const completeness = wsum > 0 ? acc / wsum : 0;
  const composite = Math.sqrt(Math.max(headroom, 0) * Math.max(completeness, 0));
  const eli = scoreEli(comp, bridged, P);

  return { headroom, completeness, composite, binding, parts, eli, bridged, portion: P };
}

/* ELI 2.0–style adherence score (adapted, not the official index).
   Follows the published architecture — graded 0–3 points per food group,
   emphasised groups reward intake, limited groups reward restraint, with a
   penalty band beyond 150% of the upper bound — but with cutoffs
   reconstructed from PHD 2.0 targets and ranges, per-dish scaling instead
   of whole-diet intake, and sodium omitted.
   14 groups × 3 pts = 42, reported as a percentage. */
export function scoreEli(comp, bridged, P) {
  let pts = 0, max = 0;
  for (const g of EMPHASISED) {
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

/* Tracked vs untracked energy. The reference portion asserts a dish is some
   share of the day's 2400 kcal; totalling the entered grams at KCAL_PER_G says
   how much of that budget the composition actually accounts for. The remainder
   is the inert food the taxonomy has no slot for — white rice, bread, pita,
   rice noodles — plus anything simply not entered. */
export function energyBreakdown(comp, settings) {
  const auto = settings.portionMode !== "fixed";
  const P = portionShare(comp, settings);
  const budget = P * DAILY_KCAL;
  const parts = ENERGY_GROUPS
    .map((g) => ({
      ...g,
      kcal: (comp[g.id] || 0) * KCAL_PER_G[g.id],
      // what share of a bridge food is actually standing in for its category
      credit: g.creditKey && settings.mode === "evidence" ? settings[g.creditKey] || 0 : 0,
    }))
    .filter((p) => p.kcal > 0.5);
  const tracked = parts.reduce((s, p) => s + p.kcal, 0);

  // Ultra-processed is not a slice of the plate but a property cutting across
  // it, so it is reported against the whole daily ceiling rather than a
  // portion-scaled one.
  const upfCeiling = CAPS.find((c) => c.id === "ultraProcessed").cap;
  const upfG = upfGrams(comp);
  const upfSources = [
    ...((comp.ultraProcessed || 0) > 0 ? [{ label: "entered directly", grams: comp.ultraProcessed }] : []),
    ...BRIDGE
      .filter((b) => (comp[b.id] || 0) > 0 && b.upfFraction)
      .map((b) => ({ label: b.label, grams: b.upfFraction * comp[b.id] })),
  ];

  return {
    auto,
    portion: P,
    budget,
    parts,
    tracked,
    upf: { grams: upfG, ceiling: upfCeiling, share: upfG / upfCeiling, sources: upfSources },
    untracked: Math.max(budget - tracked, 0),
    over: Math.max(tracked - budget, 0),
    // the bar scales to whichever is larger, so an overrun stays visible
    span: Math.max(tracked, budget),
  };
}

export function fmtPct(x) {
  return Math.round(x * 100) + "%";
}
