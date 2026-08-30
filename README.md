# Planetary Plate

Scores dishes against the EAT-Lancet 2.0 planetary health diet on two axes:

- **Headroom** — how much of the dish you could eat before a capped food group binds.
- **Completeness** — weighted delivery against the promote-group targets.

The composite is their geometric mean, so a near-zero on either axis tanks it. An
adapted ELI-style adherence score runs alongside for comparison. Sodium is
excluded by design.

Each dish sizes itself: its entered grams are priced into calories and divided by
the cost of a day that hits every target, and that share scales the dish's own
targets and ceilings. No portion guesswork.

## Running it

```
npm install
npm run dev
```

## Layout

| File | Contents |
| --- | --- |
| `src/data.js` | Food groups, targets, ceilings, energy densities, dish compositions |
| `src/recipes.js` | Recipes keyed by dish id |
| `src/scoring.js` | Headroom solver, completeness, ELI≈, portion derivation |
| `src/Profile.jsx` | Diverging food-group bar chart |
| `src/Recipe.jsx` | Recipe view |
| `src/PlanetaryPlate.jsx` | Application shell |
| `src/theme.js` | Palette and colour ramps |

## Caveats

Promote-group targets and their energy densities are derived from the
published reference table, so a day at target reconciles to the reference
energy. Densities for groups outside that table — bridge foods, and the
capped groups entered directly — remain rough central values, good enough to
separate a 300 kcal entry from a 900 kcal one but not nutrition-label
accurate. The ELI≈ score
follows the published architecture with cutoffs reconstructed from PHD 2.0
targets, scaled per dish rather than per diet. The ultra-processed ceiling is a
working number, not a Commission figure. Dishes marked *home cooked* carry
stand-in recipes rather than real ones.
