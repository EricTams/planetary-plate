import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { T, FONT } from "./theme.js";

/* Tooltips that appear on contact rather than after the browser's ~1s delay,
   and that work on a tap. Anything hoverable calls tip("text") and spreads the
   result; the panel itself lives once at the app root.

   Position is taken at the moment of entry and not tracked afterwards — a
   panel that chases the cursor would re-render the whole tree on every mouse
   move, and a still one is easier to read anyway. */

const TipContext = createContext(() => ({}));

export function useTip() {
  return useContext(TipContext);
}

const OFFSET = 14;
const MARGIN = 8;

function Panel({ tip }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  // Measure, then flip to the other side of the cursor if the panel would run
  // off the viewport. Rendered invisibly for one frame so the measurement is
  // real rather than estimated.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    let left = tip.x + OFFSET;
    let top = tip.y + OFFSET;
    if (left + width > window.innerWidth - MARGIN) left = tip.x - width - OFFSET;
    if (top + height > window.innerHeight - MARGIN) top = tip.y - height - OFFSET;
    setPos({
      left: Math.max(MARGIN, left),
      top: Math.max(MARGIN, top),
    });
  }, [tip.x, tip.y, tip.text]);

  return (
    <div ref={ref} role="tooltip" style={{
      position: "fixed",
      left: pos ? pos.left : tip.x + OFFSET,
      top: pos ? pos.top : tip.y + OFFSET,
      zIndex: 50,
      maxWidth: 320,
      padding: "8px 11px",
      borderRadius: 5,
      background: T.ink,
      color: T.paper,
      fontFamily: FONT.sans,
      fontSize: 12.5,
      lineHeight: 1.45,
      whiteSpace: "pre-line",
      pointerEvents: "none",
      boxShadow: "0 4px 16px rgba(34, 48, 31, 0.25)",
      opacity: pos ? 1 : 0,
    }}>
      {tip.text}
    </div>
  );
}

export function TooltipProvider({ children }) {
  const [tip, setTip] = useState(null);

  // A fixed panel would be stranded by a scroll, and a tap-opened one needs a
  // way out on a device with no pointer to move away.
  useEffect(() => {
    if (!tip) return;
    const clear = () => setTip(null);
    const onKey = (e) => e.key === "Escape" && clear();
    window.addEventListener("scroll", clear, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [tip]);

  const bind = useCallback((text) => {
    if (!text) return {};
    const show = (e) => setTip({ text, x: e.clientX, y: e.clientY });
    return {
      onPointerEnter: show,
      onPointerDown: show, // touch and pen, where enter does not fire reliably
      onPointerLeave: () => setTip(null),
      onPointerCancel: () => setTip(null),
    };
  }, []);

  return (
    <TipContext.Provider value={bind}>
      {children}
      {tip && <Panel tip={tip} />}
    </TipContext.Provider>
  );
}
