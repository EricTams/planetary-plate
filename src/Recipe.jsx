import { T, FONT, label } from "./theme.js";
import { barColor } from "./data.js";

/* Recipe for one dish. Ingredients carry the swatch of the food group they
   count toward, so the line between what you cook and what gets scored stays
   visible; untagged lines are inert or trace. */
export default function Recipe({ recipe, dishName, source }) {
  if (!recipe) {
    return (
      <p style={{ fontSize: 13, color: T.muted, margin: 0, maxWidth: "60ch" }}>
        {dishName} has no entry in{" "}
        <code style={{ fontFamily: FONT.mono, fontSize: 12 }}>src/recipes.js</code>. Every dish in{" "}
        <code style={{ fontFamily: FONT.mono, fontSize: 12 }}>src/data.js</code> should have one keyed by its
        id — this is a gap in the data rather than something to fill in here.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 14, fontSize: 12, color: T.muted, alignItems: "center" }}>
        {source && (
          <span style={{
            ...label, fontSize: 10, padding: "3px 7px", borderRadius: 3,
            border: `1px solid ${T.hair}`, background: "#fff", color: T.muted,
          }}>
            {source === "restaurant" ? "Restaurant portion" : "Home cooked"}
          </span>
        )}
        <span>Serves <b style={{ color: T.ink }}>{recipe.servings}</b></span>
        {recipe.time && <span>{recipe.time}</span>}
        <span>Composition above is one serving.</span>
      </div>

      {recipe.placeholder && (
        <p style={{
          fontSize: 12, color: T.muted, margin: "0 0 16px", padding: "9px 12px",
          border: `1px solid ${T.hair}`, borderRadius: 5, background: "#fff", maxWidth: "72ch",
        }}>
          <b style={{ color: T.ink }}>Method is reconstructed.</b> The ingredients and quantities below are
          yours — they divide down to the composition above exactly. The numbered steps are a plausible
          reconstruction rather than how you actually cook it, so treat those as the part to correct.
        </p>
      )}

      <div className="pp-cols">
        <div>
          <div style={{ ...label, marginBottom: 10 }}>Ingredients</div>
          {recipe.ingredients.map((ing) => (
            <div key={ing.item}
              style={{ display: "flex", gap: 9, alignItems: "baseline", marginBottom: 7, fontSize: 13 }}>
              <span aria-hidden="true" style={{
                width: 8, height: 8, borderRadius: 2, marginTop: 5, flexShrink: 0,
                background: ing.group ? barColor(ing.group) : "transparent",
                border: ing.group ? "none" : `1px solid ${T.hair}`,
              }} />
              <span style={{ flex: 1, minWidth: 0 }}>{ing.item}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted, textAlign: "right" }}>
                {ing.amount}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: T.muted, marginTop: 12, maxWidth: "44ch" }}>
            A filled swatch marks an ingredient that counts toward a scored group; an outlined one is inert
            or trace.
          </p>
        </div>

        <div>
          <div style={{ ...label, marginBottom: 10 }}>Method</div>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.55 }}>
            {recipe.steps.map((step, i) => (
              <li key={i} style={{ marginBottom: 8, paddingLeft: 2 }}>{step}</li>
            ))}
          </ol>
          {recipe.note && (
            <p style={{
              fontSize: 12, color: T.muted, marginTop: 14, paddingLeft: 11,
              borderLeft: `2px solid ${T.hair}`, maxWidth: "52ch",
            }}>
              {recipe.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
