# Hyperframes Composition Brief: AgriTrade

## Objective
Create a short launch-style brag video for AgriTrade.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080, 30fps
- Duration: 21.5 seconds

## Source Material
- Project root: `Agritrade-ng-main/`
- Primary files read: README.md, app/globals.css, app/layout.tsx (fonts), components/ui/Logo.tsx, components/ui/Sprout.tsx, components/ui/Icon.tsx, components/ui/States.tsx, components/market/ProductCard.tsx, app/(site)/orders/[id]/page.tsx, components/orders/OfferForm.tsx, lib/constants.ts, lib/format.ts, prisma/seed.ts, public/images/credits.json
- Product name: AgriTrade
- Strongest claim: "Buyers pay AgriTrade, not the seller. We release the money only after the buyer confirms delivery."
- Key UI to recreate: ProductCard (eggs listing), order page (summary table, status badge, Pay button, "Protected by AgriTrade escrow" card), buyer confirm button
- Copy that must appear verbatim:
  - Fresh brown eggs — crate of 30 / ₦4,800 / crate of 30 / Min. order 20 × crate of 30
  - Pay ₦200,000 securely
  - Awaiting payment → Paid · held in escrow → Completed
  - Protected by AgriTrade escrow
  - Buyers pay AgriTrade, not the seller.
  - I received my order: release payment
  - We release the money only after the buyer confirms delivery.

## Creative Direction
- Tone preset: app-store
- Creative direction: market-day launch film — sunlit, warm, confident
- Angle: follow one order of eggs from Ogun Valley Poultry Farms (Abeokuta) to FreshMart Supermarket (Ikeja) with the money in escrow the whole way. Both names are the app's own sample seed data.
- Hook: yam-market photo push-in, "From the farm gate / to the supermarket shelf."
- Outro: logo mark draws, "AgriTrade", "Buy wholesale from Nigerian farms. Pay through escrow."
- Avoid: generic SaaS language, abstract filler, redesigning the app's UI

## Visual Identity
- Background: #faf7f0 cream; deep greens #173a26 / #0f2418
- Text: #1b2a20 ink; #f6ebdc on dark
- Accent: #2a6340 primary green; #f2b544 sun; #8cc152 leaf; #c07a3a earth
- Display font: Fraunces (local woff2); Body font: Manrope (local woff2)
- References: LogoMark SVG, Sprout SVG, .product-card, .badge tones, .btn, .escrow-card

## Storyboard
See `brag-plan.md`. Scenes: Hook 0–3.2 · Reveal 3.2–6.3 · Find 6.3–9.6 · Pay 9.6–14.6 · Release 14.6–17.9 · Outro 17.9–21.5.

## Audio
- Role: warm bed. Music: `assets/music/happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` at 0.32, fade-in 0.4s, fade-out 1.6s.
- Cue source: bundled preset (114.8 BPM). Beat-locks: 1.60s hook line 2, 3.70s wordmark, 12.65s escrow flip, 17.91s outro logo.
- Audio-reactive: subtle. RMS envelope (15 fps, pre-extracted with ffmpeg + numpy because the hyperframes-creative helper isn't installed) drives the opacity of the sun-glow layers behind the cards and the outro logo.
- SFX: impactWood_light (hook line 2), drop_002 (logo), card-slide-1 (product card), ui/click2 (two clicks), bong_001 (escrow flip), impactSoft_medium_001 (completed), impactBell_heavy_000 (outro). Volumes 0.45–0.7.

## Hyperframes notes
The Hyperframes domain skills are not installed on this machine; the composition follows the CLI's inline docs (`hyperframes docs`) and the scaffold's CLAUDE.md, and `hyperframes check` is the gate.
