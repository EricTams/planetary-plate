import { T, FONT, label } from "./theme.js";
import { barColor, groupLabel } from "./data.js";

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


      <div className="pp-cols">
        <div>
          <div style={{ ...label, marginBottom: 10 }}>Ingredients</div>
          {recipe.ingredients.map((ing) => (
            <div key={ing.item}
              style={{ display: "flex", gap: 9, alignItems: "baseline", marginBottom: 7, fontSize: 13 }}>
              <span title={ing.group
                ? `Counts toward ${groupLabel(ing.group).toLowerCase()}`
                : "Inert or trace — counts toward nothing"}
                style={{ cursor: "help",
                width: 8, height: 8, borderRadius: 2, marginTop: 5, flexShrink: 0, display: "inline-block",
                background: ing.group ? barColor(ing.group) : "transparent",
                border: ing.group ? "none" : `1px solid ${T.hair}`,
              }} />
              <span style={{ flex: 1, minWidth: 0 }}>{ing.item}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.muted, textAlign: "right" }}>
                {ing.amount}
              </span>
            </div>
          ))}
        </div>

        <div>
          {/* Restaurant dishes carry a method so it can be checked against what
              actually arrives. Home dishes do not — the cook already knows. */}
          {recipe.steps && (
            <>
              <div style={{ ...label, marginBottom: 10 }}>Method</div>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.55 }}>
                {recipe.steps.map((step, i) => (
                  <li key={i} style={{ marginBottom: 8, paddingLeft: 2 }}>{step}</li>
                ))}
              </ol>
            </>
          )}
          {recipe.note && (
            <p style={{
              fontSize: 12, color: T.muted, marginTop: recipe.steps ? 14 : 0, paddingLeft: 11,
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
