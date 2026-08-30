import { useMemo, useState } from "react";
import { T, FONT, label, input, panel, toggle } from "./theme.js";
import {
  PROMOTE, CAPS, BRIDGE, POSITIVE_BARS, NEGATIVE_BARS, barColor,
  DEFAULT_WEIGHTS, DEFAULT_SETTINGS, SEED_DISHES, TARGET_DAY_KCAL,
} from "./data.js";
import { scoreDish, energyBreakdown, fmtPct, cappedAmount } from "./scoring.js";
import Profile from "./Profile.jsx";
import Recipe from "./Recipe.jsx";
import { RECIPES } from "./recipes.js";

/* ---------- Scatter field, shared by both plot views ---------- */
function Scatter({ scored, selectedId, hoverId, onSelect, onHover, x, y, xLabel, yLabel }) {
  const W = 560, H = 400, pad = { l: 48, r: 18, t: 20, b: 46 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = (v) => pad.l + Math.min(Math.max(v, 0), 1) * iw;
  const Y = (v) => pad.t + (1 - Math.min(Math.max(v, 0), 1)) * ih;

  // Curves of equal geometric mean: y = k² / x.
  const contours = [0.3, 0.5, 0.7, 0.9].map((k) => {
    const pts = [];
    for (let vx = k * k; vx <= 1.001; vx += 0.01) {
      const vy = (k * k) / vx;
      if (vy <= 1.001) pts.push(`${X(vx)},${Y(vy)}`);
    }
    return { k, d: "M" + pts.join(" L") };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
      role="img" aria-label={`Dishes plotted by ${xLabel} and ${yLabel}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={X(t)} y1={pad.t} x2={X(t)} y2={pad.t + ih} stroke={T.hair} strokeWidth="1" />
          <line x1={pad.l} y1={Y(t)} x2={pad.l + iw} y2={Y(t)} stroke={T.hair} strokeWidth="1" />
          <text x={X(t)} y={H - 24} textAnchor="middle" fontSize="10" fill={T.muted} fontFamily={FONT.mono}>{t}</text>
          <text x={pad.l - 8} y={Y(t) + 3} textAnchor="end" fontSize="10" fill={T.muted} fontFamily={FONT.mono}>{t}</text>
        </g>
      ))}

      {contours.map((c) => (
        <g key={c.k}>
          <path d={c.d} fill="none" stroke={T.muted} strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
          <text x={X(1) - 4} y={Y(c.k * c.k) - 5} textAnchor="end" fontSize="10" fill={T.muted} fontFamily={FONT.mono}>
            {c.k}
          </text>
        </g>
      ))}

      <text x={pad.l + iw / 2} y={H - 7} textAnchor="middle" fontSize="11" fill={T.ink}
        fontFamily={FONT.sans} fontWeight="600">{xLabel}</text>
      <text x={14} y={pad.t + ih / 2} textAnchor="middle" fontSize="11" fill={T.ink}
        fontFamily={FONT.sans} fontWeight="600"
        transform={`rotate(-90 14 ${pad.t + ih / 2})`}>{yLabel}</text>

      {scored.map((d) => {
        const active = d.id === selectedId || d.id === hoverId;
        return (
          <g key={d.id} onClick={() => onSelect(d.id)}
            onMouseEnter={() => onHover(d.id)} onMouseLeave={() => onHover(null)}
            style={{ cursor: "pointer" }}>
            <circle cx={X(x(d))} cy={Y(y(d))} r={active ? 8.5 : 5.5}
              fill={T.ink} fillOpacity={active ? 1 : 0.45}
              stroke={T.ink} strokeWidth={active ? 2 : 0} />
            {active && (
              <text x={X(x(d))} y={Y(y(d)) - 14}
                textAnchor={x(d) > 0.72 ? "end" : x(d) < 0.28 ? "start" : "middle"}
                fontSize="11" fontWeight="700" fill={T.ink} fontFamily={FONT.sans}
                stroke={T.panel} strokeWidth="3.5" paintOrder="stroke">
                {d.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Small presentational pieces ---------- */
function Stat({ name, value, caption, color, emphasis }) {
  return (
    <div style={{ minWidth: 96 }}>
      <div style={{ ...label, fontSize: 10 }}>{name}</div>
      <div style={{
        fontFamily: FONT.mono, fontSize: emphasis ? 26 : 22, fontWeight: emphasis ? 700 : 600,
        color: color || T.ink, lineHeight: 1.15,
      }}>{value}</div>
      {caption && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{caption}</div>}
    </div>
  );
}

/* Tracked vs untracked energy for one portion. Segments are the entered food
   groups in ramp order; the hatched tail is the budget the composition does
   not account for. */
function EnergyBar({ energy }) {
  const w = (kcal) => `${(kcal / energy.span) * 100}%`;
  const share = energy.budget > 0 ? energy.tracked / energy.budget : 0;

  return (
    <div>
      <div style={{ ...label, display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <span>Tracked energy</span>
        <span style={{ fontFamily: FONT.mono, textTransform: "none", letterSpacing: 0 }}>
          {energy.auto
            ? `${Math.round(energy.tracked)} kcal · ${fmtPct(energy.portion)} of a day`
            : `${Math.round(energy.tracked)} of ${Math.round(energy.budget)} kcal · ${fmtPct(share)}`}
        </span>
      </div>

      <div style={{
        position: "relative", display: "flex", height: 22, borderRadius: 4,
        overflow: "hidden", border: `1px solid ${T.hair}`, background: T.panel,
      }}>
        {energy.parts.map((p) => (
          <div key={p.id} title={`${p.label} · ${Math.round(p.kcal)} kcal`}
            style={{ width: w(p.kcal), background: p.color }} />
        ))}
        {energy.untracked > 0 && (
          <div title={`Untracked · ${Math.round(energy.untracked)} kcal`}
            style={{
              width: w(energy.untracked),
              background: `repeating-linear-gradient(45deg, ${T.hair} 0 5px, ${T.panel} 5px 10px)`,
            }} />
        )}
        {energy.over > 0 && (
          <div title={`Portion budget · ${Math.round(energy.budget)} kcal`}
            style={{
              position: "absolute", top: 0, bottom: 0, left: w(energy.budget),
              width: 2, background: T.ink,
            }} />
        )}
      </div>

      <p style={{ fontSize: 11, color: T.muted, margin: "6px 0 0", maxWidth: "78ch" }}>
        {energy.auto
          ? `The dish sizes itself: ${Math.round(energy.tracked)} kcal of entered food is ` +
            `${fmtPct(energy.portion)} of a full target day, so every target and ceiling below is scaled to ` +
            `that. The hatched tail is the ~${Math.round(energy.untracked)} kcal of inert food (white rice, ` +
            `bread, noodles) a portion this size carries alongside it.`
          : energy.over > 0
            ? `${Math.round(energy.over)} kcal past the portion budget — the entered grams come to ${fmtPct(share)} ` +
              `of what a ${Math.round(energy.budget)} kcal portion holds. The rule marks the budget.`
            : `${Math.round(energy.untracked)} kcal unattributed — inert foods the taxonomy has no slot for ` +
              `(white rice, bread, pita, rice noodles) plus anything not entered. A large hatched tail means the ` +
              `scores below describe only part of the plate.`}
      </p>
    </div>
  );
}

function Meter({ ratio, color }) {
  return (
    <div style={{ height: 5, background: T.hair, borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
      <div style={{ height: 5, width: fmtPct(ratio), background: color, borderRadius: 3 }} />
    </div>
  );
}

/* ------------------------------ UI ------------------------------ */
export default function App() {
  const [dishes, setDishes] = useState(SEED_DISHES);
  const [selectedId, setSelectedId] = useState("beyaynetu");
  const [hoverId, setHoverId] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [plot, setPlot] = useState("profile");
  const [detailTab, setDetailTab] = useState("composition");

  const scored = useMemo(
    () => dishes.map((d) => ({ ...d, score: scoreDish(d.comp, settings, weights) }))
      .sort((a, b) => b.score.composite - a.score.composite),
    [dishes, settings, weights]
  );

  const visible = scored.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = scored.find((d) => d.id === selectedId) || scored[0];
  const P = selected ? selected.score.portion : DEFAULT_SETTINGS.portionPct / 100;

  const updateComp = (dishId, key, val) => {
    setDishes((ds) => ds.map((d) =>
      d.id === dishId ? { ...d, comp: { ...d.comp, [key]: Math.max(0, Number(val) || 0) } } : d
    ));
  };

  const rename = (dishId, name) =>
    setDishes((ds) => ds.map((d) => (d.id === dishId ? { ...d, name } : d)));

  const plots = {
    profile: {
      tab: "Group profile",
      caption: "Twelve food groups for the selected dish. Bars above the line are what it delivers " +
        "against each target; bars below are what it spends against each ceiling. Both halves share a " +
        "scale clipped at 150%, and the dashed line marks 100%. Red meat, poultry and fish are omitted.",
    },
    field: {
      tab: "Headroom × completeness",
      x: (d) => d.score.headroom, y: (d) => d.score.completeness,
      xLabel: "Headroom → how much fits in a full-target day",
      yLabel: "Completeness → how much it delivers",
      caption: "Dashed curves are lines of equal composite score. Headroom binds either on a hard cap " +
        "(fish, eggs, sugar…) or on displacement — a dish that delivers little must leave room in the day " +
        "for everything it is missing.",
    },
    eli: {
      tab: "Composite vs ELI≈",
      x: (d) => d.score.composite, y: (d) => d.score.eli,
      xLabel: "Composite (headroom × completeness)",
      yLabel: "ELI≈ (adapted adherence)",
      caption: "The same construction against the adapted ELI score, so dishes toward the upper right " +
        "score well by both readings. Disagreement between the axes is the interesting part: ELI≈ rewards " +
        "restraint on limited groups, which the composite prices only through headroom.",
    },
  };
  const view = plots[plot];

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: FONT.sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Archivo:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, button:focus { outline: 2px solid ${T.green}; outline-offset: 1px; }
        .pp-shell { display: grid; grid-template-columns: minmax(260px, 340px) 1fr; align-items: start; }
        .pp-aside { border-right: 1px solid ${T.hair}; padding: 18px; min-height: 60vh; }
        .pp-stats { display: flex; flex-wrap: wrap; gap: 22px 30px; align-items: flex-start; }
        .pp-chart { max-width: 780px; margin: 0 auto; }
        .pp-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 22px; }
        .pp-row:hover { background: #fff; }
        @media (max-width: 880px) {
          .pp-shell { grid-template-columns: 1fr; }
          .pp-aside { border-right: none; border-bottom: 1px solid ${T.hair}; min-height: 0; }
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <header style={{ padding: "26px 26px 16px", borderBottom: `1px solid ${T.hair}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 14 }}>
          <h1 style={{ margin: 0, fontFamily: FONT.display, fontWeight: 400, fontSize: 34, letterSpacing: "-0.01em" }}>
            Planetary Plate
          </h1>
          <span style={{ fontSize: 13, color: T.muted }}>
            Dishes scored against EAT-Lancet 2.0 · headroom × completeness · sodium excluded by design
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 12, alignItems: "center", fontSize: 12, color: T.muted }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ display: "flex", gap: 2 }}>
              {POSITIVE_BARS.map((g) => (
                <span key={g.id} title={g.label}
                  style={{ width: 9, height: 14, background: g.color, borderRadius: 2, display: "inline-block" }} />
              ))}
            </span>
            above the line · share of each target delivered
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ display: "flex", gap: 2 }}>
              {NEGATIVE_BARS.map((c) => (
                <span key={c.id} title={c.label}
                  style={{ width: 9, height: 14, background: c.color, borderRadius: 2, display: "inline-block" }} />
              ))}
            </span>
            below the line · share of each ceiling spent, outlined when over
          </span>
        </div>
      </header>

      <div className="pp-shell">
        {/* ---------- left: ranked dish list ---------- */}
        <aside className="pp-aside">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes"
            aria-label="Search dishes"
            style={{ ...input, width: "100%", padding: "8px 10px", fontSize: 13, fontFamily: FONT.sans, marginBottom: 12 }} />

          <div style={{ ...label, marginBottom: 8 }}>
            {visible.length} {visible.length === 1 ? "dish" : "dishes"} · ranked by composite
          </div>

          {visible.map((d) => {
            const sel = d.id === selected?.id;
            const rank = scored.indexOf(d) + 1;
            return (
              <button key={d.id} className="pp-row" onClick={() => setSelectedId(d.id)}
                onMouseEnter={() => setHoverId(d.id)} onMouseLeave={() => setHoverId(null)}
                aria-current={sel}
                style={{
                  display: "block", width: "100%", textAlign: "left", marginBottom: 6, padding: "9px 11px",
                  borderRadius: 6, cursor: "pointer", fontFamily: FONT.sans,
                  border: `1px solid ${sel ? T.ink : T.hair}`,
                  background: sel ? "#fff" : T.panel,
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>{rank}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</span>
                  </span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 700, color: T.ink }}>
                    {fmtPct(d.score.composite)}
                  </span>
                </div>
                <Meter ratio={d.score.composite} color={T.ink} />
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4, fontFamily: FONT.mono }}>
                  headroom {fmtPct(d.score.headroom)} · completeness {fmtPct(d.score.completeness)}
                </div>
              </button>
            );
          })}

          {visible.length === 0 && (
            <p style={{ fontSize: 13, color: T.muted }}>No dish matches “{query}”.</p>
          )}
        </aside>

        {/* ---------- right: plot + detail ---------- */}
        <main style={{ padding: 18, display: "grid", gap: 18 }}>
          <section style={{ ...panel, padding: 14 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {Object.entries(plots).map(([id, p]) => (
                <button key={id} onClick={() => setPlot(id)} style={toggle(plot === id)}>{p.tab}</button>
              ))}
            </div>
            <div className="pp-chart">
              {plot === "profile" ? (
                selected && <Profile dish={selected} />
              ) : (
                <Scatter scored={scored} selectedId={selected?.id} hoverId={hoverId}
                  onSelect={setSelectedId} onHover={setHoverId}
                  x={view.x} y={view.y} xLabel={view.xLabel} yLabel={view.yLabel} />
              )}
              <p style={{ margin: "10px 0 0", fontSize: 12, color: T.muted }}>{view.caption}</p>
            </div>
          </section>

          {selected && (
            <section style={{ ...panel, padding: 18 }}>
              <input value={selected.name} onChange={(e) => rename(selected.id, e.target.value)}
                aria-label="Dish name"
                style={{
                  fontFamily: FONT.display, fontSize: 27, border: "none", background: "transparent",
                  color: T.ink, width: "min(460px, 100%)", padding: 0, marginBottom: 4,
                }} />
              {selected.note && (
                <p style={{ margin: "0 0 14px", fontSize: 13, color: T.muted, maxWidth: "72ch" }}>{selected.note}</p>
              )}

              <div className="pp-stats" style={{ paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${T.hair}` }}>
                <Stat name="Composite" value={fmtPct(selected.score.composite)} emphasis
                  caption="geometric mean of the two axes" />
                <Stat name="Headroom" value={fmtPct(selected.score.headroom)}
                  caption={selected.score.binding ? `binds on ${selected.score.binding}` : "nothing binds"} />
                <Stat name="Completeness" value={fmtPct(selected.score.completeness)}
                  caption={`vs targets at ${fmtPct(P)} of a day`} />
                <Stat name="ELI≈" value={fmtPct(selected.score.eli)}
                  caption="adapted graded adherence" />
              </div>

              <div style={{ marginBottom: 20 }}>
                <EnergyBar energy={energyBreakdown(selected.comp, settings)} />
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[
                  { id: "composition", name: "Composition" },
                  { id: "recipe", name: "Recipe" },
                ].map((t) => (
                  <button key={t.id} onClick={() => setDetailTab(t.id)}
                    style={toggle(detailTab === t.id)}>{t.name}</button>
                ))}
              </div>

              {detailTab === "recipe" ? (
                <Recipe recipe={RECIPES[selected.id]} dishName={selected.name} source={selected.source} />
              ) : (
              <div className="pp-cols">
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>
                    Delivers · grams per portion vs scaled target
                  </div>
                  {POSITIVE_BARS.map((g) => {
                    const scaledTarget = Math.round(g.target * P);
                    const delivered = Math.round(selected.score.bridged[g.id] || 0);
                    return (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <input type="number" min="0" value={selected.comp[g.id]}
                          onChange={(e) => updateComp(selected.id, g.id, e.target.value)}
                          style={input} aria-label={g.label} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span>{g.label}</span>
                            <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted }}>
                              {delivered} / {scaledTarget} {g.unit}
                            </span>
                          </div>
                          <Meter ratio={selected.score.parts[g.id]} color={g.color} />
                        </div>
                        <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted, width: 36, textAlign: "right" }}>
                          {fmtPct(selected.score.parts[g.id])}
                        </span>
                      </div>
                    );
                  })}

                  <div style={{ ...label, margin: "16px 0 8px" }}>Bridge foods</div>
                  {BRIDGE.map((b) => {
                    const credit = settings.mode === "evidence" ? settings[b.creditKey] || 0 : 0;
                    const to = b.creditsTo === "wholeGrains" ? "whole grains" : "legumes";
                    return (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <input type="number" min="0" value={selected.comp[b.id]}
                          onChange={(e) => updateComp(selected.id, b.id, e.target.value)}
                          style={input} aria-label={b.label} />
                        <div style={{ flex: 1, fontSize: 13 }}>
                          {b.label} <span style={{ color: T.muted, fontSize: 11 }}>({b.unit})</span>
                          <div style={{ fontSize: 11, color: credit ? T.green : T.muted, marginTop: 1 }}>
                            {credit
                              ? `+${Math.round(credit * (selected.comp[b.id] || 0))} g to ${to} (${Math.round(credit * 100)}%)`
                              : "inert in strict mode"}
                            {b.upfFraction ? ` · ${Math.round(b.upfFraction * 100)}% counts as ultra-processed` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <div style={{ ...label, marginBottom: 8 }}>
                    Capped groups · grams per portion vs scaled ceiling
                  </div>
                  {/* Plant oils are entered in the Delivers column; their ceiling still binds in headroom. */}
                  {CAPS.filter((c) => c.id !== "plantOilsCap").map((c) => {
                    const field = c.from || c.id;
                    const amt = cappedAmount(selected.comp, c);
                    const scaledCap = c.cap * P;
                    const ratio = Math.min(amt / scaledCap, 1);
                    const over = amt > scaledCap;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <input type="number" min="0" value={selected.comp[field]}
                          onChange={(e) => updateComp(selected.id, field, e.target.value)}
                          style={input} aria-label={c.label} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span>{c.label}</span>
                            <span style={{
                              fontFamily: FONT.mono, fontSize: 11,
                              color: over ? T.ink : T.muted, fontWeight: over ? 700 : 400,
                            }}>
                              {Math.round(amt)} / {Math.round(scaledCap)} g
                            </span>
                          </div>
                          <Meter ratio={ratio} color={barColor(c.id)} />
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.hint}</div>
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ fontSize: 11, color: T.muted, marginTop: 12, maxWidth: "60ch" }}>
                    White rice, bread and rice noodles are inert — neither credited nor capped.
                  </p>
                </div>
              </div>
              )}
            </section>
          )}

          <section style={panel}>
            <button onClick={() => setShowSettings((s) => !s)} aria-expanded={showSettings}
              style={{ width: "100%", textAlign: "left", padding: "12px 18px", background: "transparent", border: "none", cursor: "pointer", ...label, fontSize: 12 }}>
              {showSettings ? "▾" : "▸"} Method settings — scoring mode, portion scaling & weights
            </button>
            {showSettings && (
              <div className="pp-cols" style={{ padding: "0 18px 18px" }}>
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>Scoring mode</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[
                      { id: "strict", name: "Strict EAT-Lancet" },
                      { id: "evidence", name: "Evidence-adjusted" },
                    ].map((m) => (
                      <button key={m.id} onClick={() => setSettings((s) => ({ ...s, mode: m.id }))}
                        style={toggle(settings.mode === m.id)}>{m.name}</button>
                    ))}
                  </div>
                  {settings.mode === "evidence" && (
                    <>
                      {BRIDGE.map((b) => (
                        <div key={b.creditKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <input type="number" min="0" max="1" step="0.05" value={settings[b.creditKey]}
                            onChange={(e) => setSettings((s) => ({ ...s, [b.creditKey]: Math.max(0, Number(e.target.value) || 0) }))}
                            style={input} aria-label={`${b.label} credit`} />
                          <span style={{ fontSize: 13 }}>
                            {b.label} → {b.creditsTo === "wholeGrains" ? "whole grains" : "legumes"}
                          </span>
                        </div>
                      ))}
                      <p style={{ fontSize: 12, color: T.muted, marginTop: 8, maxWidth: "60ch" }}>
                        Judgment dials, not measurements. Pasta earns low-GI behavior but not whole-grain fiber;
                        wheat gluten does legumes' protein job without their fiber; pea isolate is legume-origin
                        but fiber-stripped.
                      </p>
                    </>
                  )}
                  <div style={{ ...label, margin: "16px 0 8px" }}>Reference portion</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[
                      { id: "auto", name: "From energy" },
                      { id: "fixed", name: "Fixed share" },
                    ].map((m) => (
                      <button key={m.id} onClick={() => setSettings((s) => ({ ...s, portionMode: m.id }))}
                        style={toggle((settings.portionMode !== "fixed") === (m.id === "auto"))}>{m.name}</button>
                    ))}
                  </div>
                  {settings.portionMode === "fixed" ? (
                    <>
                      <div style={{ fontSize: 13, marginBottom: 6 }}>
                        Every dish treated as {settings.portionPct}% of a day
                      </div>
                      <input type="range" min="20" max="60" step="5" value={settings.portionPct}
                        onChange={(e) => setSettings((s) => ({ ...s, portionPct: Number(e.target.value) }))}
                        aria-label="Reference portion as a percentage of daily energy"
                        style={{ width: "100%", accentColor: T.green }} />
                      <p style={{ fontSize: 12, color: T.muted, maxWidth: "60ch" }}>
                        One assumed share for every dish. Useful for what-ifs, but a dish whose grams say
                        otherwise will read as over- or under-delivering against targets scaled to a size it
                        never had.
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: T.muted, maxWidth: "60ch" }}>
                      Each dish sizes itself. Its entered grams are priced into calories and divided by
                      the {Math.round(TARGET_DAY_KCAL)} kcal a day hitting every target costs, and the result
                      scales that dish's targets and ceilings. No portion guesswork, and a bigger plate is held
                      to proportionally bigger targets rather than flattering itself.
                      {selected && (
                        <> {selected.name} comes to <b style={{ color: T.ink }}>{fmtPct(P)}</b> of a day.</>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 8 }}>Completeness weights</div>
                  {PROMOTE.map((g) => (
                    <div key={g.id} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      <input type="number" min="0" max="1" step="0.05" value={weights[g.id]}
                        onChange={(e) => setWeights((w) => ({ ...w, [g.id]: Math.max(0, Number(e.target.value) || 0) }))}
                        style={input} aria-label={`Weight for ${g.label}`} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13 }}>{g.label}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{g.hint}</div>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: T.muted, marginTop: 8, maxWidth: "60ch" }}>
                    Gram-proportional for the emphasised groups. Dairy and tubers default to 0 because their PHD
                    ranges start at zero — their ceilings still bind. A weight of 0 also drops a group from
                    headroom's required-day accounting.
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
