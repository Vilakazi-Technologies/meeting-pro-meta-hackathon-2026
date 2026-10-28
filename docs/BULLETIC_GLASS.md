# VILATECH liquid glass standard (Meeting Pro + Bulletic products)

This app follows the same visual system as **[vilatech.co](https://www.vilatech.co)** (`VILATECH WEBSITE/src/app/globals.css`) and the skills you installed for premium UI:

| Skill | Role |
|--------|------|
| **frontend-design-direction** (ECC) | Product-first layout, no AI-slop, evidence-based polish |
| **liquid-glass-design** | iOS 26 material: blur, sheen, depth, interactive glass |
| **design-system** | Shared tokens, consistent components |

## Implementation in Meeting Pro (Expo)

- **Tokens:** `src/constants/glass.ts` (mirrors `--liquid-*`, ambient orbs, card shadows)
- **Theme:** `src/constants/theme.ts` — dark canvas `#050505` like the marketing site
- **Variant:** Web and iOS 26+ use **`liquid`** glass (`src/utils/platform.ts`)
- **Components:** `GlassBackground`, `GlassCard`, `GlassInput`, `GlassPrimaryButton`, `GlassTabBar`, `WebAppFrame`

## Rules for new Bulletic / VILATECH surfaces

1. One **dark premium canvas** (#050505) with **slow ambient** indigo / sky / violet orbs — not flat grey.
2. **Glass cards:** blur + top sheen + rim border + deep shadow (see `GlassCard`).
3. **Desktop web:** centered **device frame** (`WebAppFrame`), not full-bleed stretched UI.
4. **Typography:** tight headlines, uppercase micro-labels for brand (VILATECH / Lumiq).
5. **No** generic purple hero blobs, nested card stacks, or decorative copy that repeats what controls already say.

## Reference

Canonical CSS: `VILATECH WEBSITE/src/app/globals.css` (`.liquid-card`, `.glass-card`, `lg-ambient`).  
Pointer specular on the marketing site uses `LiquidGlass` — optional future port for Expo web.
