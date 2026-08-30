import { T, FONT } from "./theme.js";
import { POSITIVE_BARS, NEGATIVE_BARS } from "./data.js";
import { fmtPct, cappedAmount } from "./scoring.js";

/* Group profile — one diverging bar per food group for a single dish.
   Bars rise from the zero line as a share of the scaled promote-target and
   fall from it as a share of the scaled ceiling, so a good dish reads as a
   tall block above the line and a shallow one below. Both halves use the
   same scale, clipped at 150%, with a dashed reference line at 100%. */

const MAX_RATIO = 1.5;

export default function Profile({ dish }) {
  const P = dish.score.portion;
  const W = 760, H = 330;
  const pad = { l: 46, r: 16, t: 26, b: 26 };
  const iw = W - pad.l - pad.r;
  const zero = pad.t + (H - pad.t - pad.b) / 2;
  const half = (H - pad.t - pad.b) / 2 - 30; // px representing 150%; rest is label room
  const px = (r) => (Math.min(r, MAX_RATIO) / MAX_RATIO) * half;

  // 12 slots plus a half-slot gutter separating the two halves.
  const slot = iw / 12.5;
  const barW = Math.min(slot * 0.6, 30);
  const posX = (i) => pad.l + slot * (i + 0.5);
  const negX = (j) => pad.l + slot * (7 + j);
  const midX = pad.l + slot * 6.25;

  const positives = POSITIVE_BARS.map((g, i) => {
    const delivered = dish.score.bridged[g.id] || 0;
    const target = g.target * P;
    return {
      key: g.id, x: posX(i), short: g.short, color: g.color,
      ratio: target > 0 ? delivered / target : 0,
      title: `${g.label} — delivers ${Math.round(delivered)} of a ${Math.round(target)} ${g.unit} target\n` +
        `${fmtPct(target > 0 ? delivered / target : 0)} of target · bars above the line clip at 150%`,
    };
  });

  const negatives = NEGATIVE_BARS.map((c, j) => {
    const amt = cappedAmount(dish.comp, c);
    const cap = c.cap * P;
    return {
      key: c.id, x: negX(j), short: c.short, color: c.color,
      ratio: cap > 0 ? amt / cap : 0,
      title: `${c.label} — spends ${Math.round(amt)} of a ${Math.round(cap)} g ceiling\n` +
        `${fmtPct(cap > 0 ? amt / cap : 0)} of ceiling${amt > cap ? " · over, shown outlined" : ""}`,
    };
  });

  const ticks = [0.5, 1, 1.5];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
      role="img" aria-label={`Food-group profile for ${dish.name}`}>
      {/* horizontal guides, mirrored above and below the zero line */}
      {ticks.map((t) => (
        <g key={t}>
          {[-1, 1].map((s) => (
            <line key={s} x1={pad.l} y1={zero - s * px(t)} x2={pad.l + iw} y2={zero - s * px(t)}
              stroke={t === 1 ? T.muted : T.hair} strokeWidth="1"
              strokeDasharray={t === 1 ? "4 4" : undefined} opacity={t === 1 ? 0.6 : 1} />
          ))}
          {[-1, 1].map((s) => (
            <text key={`l${s}`} x={pad.l - 8} y={zero - s * px(t) + 3} textAnchor="end"
              fontSize="9" fill={T.muted} fontFamily={FONT.mono}>{fmtPct(t)}</text>
          ))}
        </g>
      ))}

      {/* gutter between the two halves */}
      <line x1={midX} y1={pad.t} x2={midX} y2={H - pad.b} stroke={T.hair} strokeWidth="1" />

      {/* positive bars, rising */}
      {positives.map((b) => {
        const h = px(b.ratio);
        return (
          <g key={b.key}>
            <title>{b.title}</title>
            <rect x={b.x - barW / 2} y={zero - h} width={barW} height={h} fill={b.color} rx="2" style={{ cursor: "help" }} />
            {b.ratio > MAX_RATIO && (
              <path d={`M${b.x - 5},${zero - h - 4} L${b.x + 5},${zero - h - 4} L${b.x},${zero - h - 11} Z`} fill={b.color} />
            )}
            <text x={b.x} y={zero - h - (b.ratio > MAX_RATIO ? 16 : 6)} textAnchor="middle"
              fontSize="10" fontFamily={FONT.mono} fill={T.ink}>{fmtPct(b.ratio)}</text>
            <text x={b.x} y={zero + 15} textAnchor="middle" fontSize="10"
              fontFamily={FONT.sans} fill={T.muted}>{b.short}</text>
          </g>
        );
      })}

      {/* negative bars, falling */}
      {negatives.map((b) => {
        const h = px(b.ratio);
        const over = b.ratio > 1;
        return (
          <g key={b.key}>
            <title>{b.title}</title>
            <rect x={b.x - barW / 2} y={zero} width={barW} height={h} fill={b.color} rx="2"
              stroke={over ? T.ink : "none"} strokeWidth={over ? 1.5 : 0} style={{ cursor: "help" }} />
            {b.ratio > MAX_RATIO && (
              <path d={`M${b.x - 5},${zero + h + 4} L${b.x + 5},${zero + h + 4} L${b.x},${zero + h + 11} Z`} fill={b.color} />
            )}
            <text x={b.x} y={zero + h + (b.ratio > MAX_RATIO ? 24 : 15)} textAnchor="middle"
              fontSize="10" fontFamily={FONT.mono} fontWeight={over ? 700 : 400} fill={T.ink}>{fmtPct(b.ratio)}</text>
            <text x={b.x} y={zero - 7} textAnchor="middle" fontSize="10"
              fontFamily={FONT.sans} fill={T.muted}>{b.short}</text>
          </g>
        );
      })}

      {/* the zero line sits on top of everything */}
      <line x1={pad.l} y1={zero} x2={pad.l + iw} y2={zero} stroke={T.ink} strokeWidth="1.5" />

      <text x={pad.l} y={pad.t - 10} fontSize="11" fontFamily={FONT.sans} fontWeight="600" fill={T.ink}>
        ↑ delivered, as a share of target
      </text>
      <text x={pad.l + iw} y={H - pad.b + 16} textAnchor="end" fontSize="11" fontFamily={FONT.sans}
        fontWeight="600" fill={T.ink}>
        ↓ consumed, as a share of ceiling
      </text>
    </svg>
  );
}
