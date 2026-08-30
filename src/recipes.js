/* Recipes keyed by dish id. Amounts are written for the stated serving count
   and chosen so that one serving lands near that dish's entry in SEED_DISHES —
   the recipe is where the composition grams come from, so editing one should
   mean revisiting the other. `group` tags an ingredient with the food group it
   counts toward; untagged ingredients are inert or trace (spices, aromatics,
   white rice, water). */

export const RECIPES = {
  beyaynetu: {
    servings: 2,
    time: "2 h, mostly unattended",
    ingredients: [
      { item: "Teff injera", amount: "2.5 rounds (≈480 g)", group: "wholeGrains" },
      { item: "Red lentils, dry — misir wot", amount: "70 g", group: "legumes" },
      { item: "Yellow split peas, dry — kik alicha", amount: "65 g", group: "legumes" },
      { item: "Chickpea flour — shiro", amount: "35 g", group: "legumes" },
      { item: "Collard greens, raw — gomen", amount: "300 g", group: "vegetables" },
      { item: "Cabbage and carrot — tikil gomen", amount: "170 g", group: "vegetables" },
      { item: "Potato, diced", amount: "50 g", group: "tubers" },
      { item: "Onion, finely diced", amount: "200 g" },
      { item: "Niter kibbeh (spiced clarified butter)", amount: "16 g", group: "animalTropFat" },
      { item: "Neutral oil", amount: "32 g", group: "plantOils" },
      { item: "Berbere, turmeric, garlic, ginger", amount: "to taste" },
    ],
    steps: [
      "Sweat the onion dry in a wide pan until it collapses and browns, 15 minutes, before adding any oil — this is what gives the wots their depth.",
      "Split the onion three ways. For misir wot, add niter kibbeh and berbere, bloom, then the lentils and water; simmer 30 minutes to a thick stew.",
      "For kik alicha, add oil, turmeric, garlic and ginger, then the split peas and water; simmer 40 minutes until soft and pale gold.",
      "For shiro, whisk the chickpea flour into water off the heat, then cook it down with niter kibbeh and berbere for 15 minutes until it thickens and no longer tastes raw.",
      "Braise the collards with garlic until tender — 300 g raw cooks down to about two ½-cup mounds. Cook the cabbage, carrot and potato with turmeric until just soft.",
      "Line a platter with injera and spoon each stew in its own mound. Serve with extra injera for tearing.",
    ],
    note: "Sized as a restaurant platter shared by two, not a family batch: five mounds of roughly 60-75 g each per person. Onion is absorbed into the wots and already counted in their weight, so it is left untagged rather than added to vegetables twice. The niter kibbeh decides this dish's score — 8 g per person against a 5 g scaled ceiling is what binds its headroom.",
  },

  puttanesca: {
    servings: 4,
    time: "35 min",
    ingredients: [
      { item: "Semolina pasta, dry", amount: "440 g", group: "refinedPasta" },
      { item: "Italian Field Roast sausage", amount: "368 g", group: "fieldRoast" },
      { item: "Tomatoes, tinned whole", amount: "650 g", group: "vegetables" },
      { item: "Onion, diced", amount: "200 g", group: "vegetables" },
      { item: "Capers and olives", amount: "90 g", group: "vegetables" },
      { item: "Olive oil", amount: "60 g", group: "plantOils" },
      { item: "Parmesan, grated", amount: "40 g (×7 = 280 milk-eq)", group: "dairy" },
      { item: "Calabrian chili, garlic", amount: "to taste" },
    ],
  },

  sundubu: {
    servings: 1,
    time: "25 min",
    ingredients: [
      { item: "Soft tofu", amount: "280 g", group: "legumes" },
      { item: "Kimchi and vegetables", amount: "160 g", group: "vegetables" },
      { item: "Chili and toasted sesame oil", amount: "8 g", group: "plantOils" },
      { item: "Kelp stock", amount: "400 ml" },
      { item: "Gochugaru, garlic, soy sauce", amount: "to taste" },
      { item: "White rice, alongside", amount: "200 g cooked", group: "whiteRice" },
    ],
  },

  mapo: {
    servings: 4,
    time: "30 min",
    ingredients: [
      { item: "Firm tofu, cubed", amount: "800 g", group: "legumes" },
      { item: "Beyond crumbles", amount: "230 g", group: "beyond" },
      { item: "Sweet peas", amount: "160 g", group: "vegetables" },
      { item: "Scallion", amount: "80 g", group: "vegetables" },
      { item: "Neutral oil", amount: "60 g", group: "plantOils" },
      { item: "Doubanjiang", amount: "50 g" },
      { item: "Douchi, garlic, ginger, Sichuan peppercorn", amount: "to taste" },
      { item: "Cornstarch slurry", amount: "-" },
    ],
  },

  chili: {
    servings: 6,
    time: "1 h 15 min",
    ingredients: [
      { item: "Beyond mince", amount: "680 g", group: "beyond" },
      { item: "Kidney, pinto and black beans, cooked", amount: "780 g", group: "legumes" },
      { item: "Hominy", amount: "390 g", group: "wholeGrains" },
      { item: "Tomatoes and tomatillos", amount: "1.1 kg", group: "vegetables" },
      { item: "Bell pepper, jalapeño, green chiles", amount: "500 g", group: "vegetables" },
      { item: "Onion", amount: "200 g", group: "vegetables" },
      { item: "Sweetcorn", amount: "-", group: "vegetables" },
      { item: "Neutral oil", amount: "48 g", group: "plantOils" },
      { item: "Sour cream and cheddar, to top", amount: "≈1.2 kg milk-eq", group: "dairy" },
      { item: "Chipotle in adobo, cumin, oregano", amount: "to taste" },
    ],
    note: "The toppings are the single largest lever here — 200 g milk-eq per serving is most of the dairy ceiling.",
  },

  gochujangTofu: {
    servings: 2,
    time: "35 min",
    ingredients: [
      { item: "Firm tofu, pressed and cubed", amount: "350 g", group: "legumes" },
      { item: "Broccoli, florets", amount: "400 g", group: "vegetables" },
      { item: "Potato starch, for dredging", amount: "40 g" },
      { item: "Neutral oil, for frying", amount: "24 g", group: "plantOils" },
      { item: "Gochujang", amount: "40 g" },
      { item: "Corn syrup or honey", amount: "24 g", group: "addedSugar" },
      { item: "Sesame seeds", amount: "10 g", group: "nuts" },
      { item: "Soy sauce, garlic, rice vinegar", amount: "to taste" },
    ],
  },

  pho: {
    servings: 1,
    time: "1 h for the broth, 5 min to assemble",
    ingredients: [
      { item: "Tofu", amount: "150 g", group: "legumes" },
      { item: "Straw mushrooms, bean sprouts, herbs and the fixins", amount: "140 g", group: "vegetables" },
      { item: "Rock sugar", amount: "5 g", group: "addedSugar" },
      { item: "Neutral oil", amount: "3 g", group: "plantOils" },
      { item: "Rice noodles", amount: "200 g cooked", group: "riceNoodles" },
      { item: "Veggie broth", amount: "700 ml" },
      { item: "Charred onion and ginger, star anise, cinnamon, clove", amount: "for the broth" },
    ],
  },

  cashewTofu: {
    servings: 1,
    time: "20 min",
    ingredients: [
      { item: "Firm tofu, cubed", amount: "180 g", group: "legumes" },
      { item: "Cashews", amount: "30 g", group: "nuts" },
      { item: "Bell pepper, celery, onion", amount: "140 g", group: "vegetables" },
      { item: "Neutral oil", amount: "20 g", group: "plantOils" },
      { item: "Sugar", amount: "10 g", group: "addedSugar" },
      { item: "Soy sauce, Shaoxing, rice vinegar, garlic", amount: "to taste" },
      { item: "White rice, alongside", amount: "200 g cooked", group: "whiteRice" },
    ],
    steps: [
      "Toast the cashews dry in the wok until they colour, then tip them out.",
      "Fry the tofu in a hot, heavily oiled wok without moving it until each face sets, then remove.",
      "Stir-fry the vegetables hard and briefly so they stay snappy.",
      "Return the tofu, add the sauce, thicken with a cornstarch slurry.",
      "Cashews in off the heat so they stay crisp.",
    ],
    note: "A restaurant wok carries far more oil than a home pan — around 20 g per order.",
  },

  vegThali: {
    servings: 1,
    time: "served as one tray",
    ingredients: [
      { item: "Dal, in a katori", amount: "150 g", group: "legumes" },
      { item: "Roti", amount: "90 g (2)", group: "wholeGrains" },
      { item: "Sabzi, in a katori", amount: "110 g", group: "vegetables" },
      { item: "Aloo", amount: "70 g", group: "tubers" },
      { item: "Raita", amount: "80 g", group: "dairy" },
      { item: "Salad", amount: "40 g", group: "vegetables" },
      { item: "Papad", amount: "2 (25 g), deep-fried" },
      { item: "Pickle and chutney", amount: "15 g" },
      { item: "White rice", amount: "150 g cooked", group: "whiteRice" },
      { item: "Ghee, on the roti and in the tadka", amount: "8 g", group: "animalTropFat" },
      { item: "Oil, across the tray and the papad", amount: "26 g", group: "plantOils" },
    ],
    steps: [
      "Dal cooked to collapse, then whisked smooth and finished with a tadka of cumin, mustard seed and curry leaf.",
      "Sabzi kept drier than the dal for contrast, with its own tadka.",
      "Aloo fried with cumin and amchur until the edges catch.",
      "Raita whisked with cucumber, salt and roasted cumin.",
      "Papad fried to order, pickle and salad plated alongside.",
      "Everything arrives at once in katoris with hot roti.",
    ],
    note: "Portions are the small katoris a thali actually comes in. Roti counts as whole grain, raita as 1× milk-eq. The papad is deep-fried and the pickle is oil-packed, so both land as plant oil without earning anything back.",
  },

  mezze: {
    servings: 1,
    time: "served as one plate",
    ingredients: [
      { item: "Hummus", amount: "80 g", group: "legumes" },
      { item: "Falafel", amount: "100 g (4)", group: "legumes" },
      { item: "Mercimek köfte", amount: "20 g", group: "legumes" },
      { item: "Salad and olives", amount: "110 g", group: "vegetables" },
      { item: "Walnut muhammara", amount: "15 g", group: "nuts" },
      { item: "Olive oil, across the plate", amount: "28 g", group: "plantOils" },
      { item: "White pita", amount: "90 g", group: "refinedBread" },
    ],
    steps: [
      "Falafel from chickpeas soaked overnight and never cooked first, blitzed coarse with onion, parsley and cumin, rested, then fried to order.",
      "Hummus blended long with ice water and tahini until it turns pale and aerated.",
      "Mercimek köfte worked from red lentils and fine bulgur with pepper paste, shaped into quenelles.",
      "Muhammara blended from roasted pepper, walnut, breadcrumb and pomegranate molasses.",
      "Plated together with the salad and olives, finished with a heavy pour of olive oil.",
    ],
    note: "The olive oil pour is the part home cooks underestimate — a mezze plate carries close to 30 g across the spreads.",
  },

  beanTacos: {
    servings: 1,
    time: "served as three tacos plus a side",
    ingredients: [
      { item: "Corn tortillas", amount: "90 g (3)", group: "wholeGrains" },
      { item: "Refried beans, side", amount: "120 g", group: "legumes" },
      { item: "Lard (manteca), in the beans", amount: "8 g", group: "animalTropFat" },
      { item: "Mexican rice, side", amount: "160 g cooked", group: "whiteRice" },
      { item: "Tomato and onion, in the rice", amount: "15 g", group: "vegetables" },
      { item: "Calabacita squash, corn, onion, tomato", amount: "120 g", group: "vegetables" },
      { item: "Crema", amount: "30 g (×2 = 60 milk-eq)", group: "dairy" },
      { item: "Queso fresco", amount: "12 g (×4 = 48 milk-eq)", group: "dairy" },
      { item: "Neutral oil, on the plancha and in the rice", amount: "23 g", group: "plantOils" },
      { item: "Garlic, epazote, chili", amount: "to taste" },
    ],
    steps: [
      "Squash cooked on the plancha with onion, garlic, corn and tomato until it fries rather than steams.",
      "Beans mashed and fried in rendered lard — the manteca is the point of frijoles refritos, and it is what the score turns on.",
      "Rice toasted in oil until it smells nutty, then simmered with tomato and onion.",
      "Tortillas heated on the comal until they blister and puff.",
      "Filled, then finished with crema and crumbled queso fresco.",
    ],
    note: "Corn tortillas count as whole grain via nixtamalization. Two things hide on this plate: the dairy, where crema at ×2 and queso fresco at ×4 come to ≈110 g milk-eq, and the lard in the beans, which breaches the animal-fat ceiling at twice over. The rice earns nothing — white rice is inert — but the oil it is fried in still counts against the plate.",
  },

  cheesePlate: {
    servings: 2,
    time: "10 min",
    ingredients: [
      { item: "Assorted cheese", amount: "180 g (≈1.26 kg milk-eq)", group: "dairy" },
      { item: "Walnuts", amount: "44 g", group: "nuts" },
      { item: "Grapes", amount: "140 g", group: "fruits" },
      { item: "Wholegrain crackers", amount: "80 g", group: "wholeGrains" },
    ],
  },
};
