# Brag Plan: AgriTrade

> **Revision 2 (user request):** show sign-up as buyer or seller, product listing, search and finding, payment, notification and delivery. Duration extended to 36s at the user's choice.
> **Notification is a mock.** AgriTrade has no notification feature (README: "Ratings, notifications: Not implemented"). The user chose to show notification banners anyway; their wording reuses real app copy ("Payment received and held in escrow." from `lib/orders.ts`, "The seller has dispatched your order." from the order page).
>
> Revised storyboard (36.0s):
> 1. Hook 0–3.2 — yam market photo, "From the farm gate / to the supermarket shelf."
> 2. Reveal 3.2–6.3 — logo draws, "Wholesale farm produce across Nigeria.", category chips
> 3. Join 6.3–10.5 — "Sign up to buy or to sell."; Join AgriTrade form; pointer picks "I'm buying", then "I'm selling"; button switches "Create buyer account" → "Create seller account"
> 4. List 10.5–14.9 — "Sellers list their produce." / "Listings go live once approved."; Product basics form types "Fresh brown eggs — crate of 30", fills unit, category, ₦4800, min 20; "Submit for review" → "Pending review"
> 5. Find 14.9–19.6 — "Buyers search and find it."; search bar types "eggs" → "2 listings found" → two real seeded product cards; pointer picks the crate listing
> 6. Pay 19.6–24.4 — "Pay ₦200,000 securely" → "Opening checkout…" → "Paid · held in escrow"; escrow card
> 7. Notify & deliver 24.4–28.9 — "Everyone stays in the loop."; mock banner to seller; seller clicks "Mark as dispatched" → "Dispatched"; mock banner to buyer
> 8. Confirm 28.9–32.2 — "Paid out only after delivery."; "I received my order: release payment" → "Completed", sprout, "The payment was released to the seller."
> 9. Outro 32.2–36.0 — logo, "Buy wholesale from Nigerian farms. Pay through escrow."
>
> The original 22s plan below is kept for reference.

## What is this app?
A wholesale marketplace where Nigerian supermarkets, shops, restaurants and caterers buy eggs, poultry, fish, yam, onions and other farm produce directly from farms, fisheries and aggregators — and every naira goes through escrow until the buyer confirms delivery.

## The angle
Follow one real order, start to finish. A crate of eggs from a farm in Abeokuta to a supermarket in Ikeja, and the money that waits in escrow the whole way. The product's own copy is the strongest claim it makes: "Buyers pay AgriTrade, not the seller." The video proves that line by showing the order status move from "Awaiting payment" to "Paid · held in escrow" to "Completed".

## Hook (first 2-3 seconds)
Full-bleed photo of yam tubers stacked at a Port Harcourt market (the app's own imagery), slow push-in. Big Fraunces line: "From the farm gate / to the supermarket shelf." Line two lands on the first strong cue (1.60s).

## Key moments (the middle)
- The real ProductCard: "Fresh brown eggs — crate of 30", ₦4,800 / crate of 30, Abeokuta, Ogun · Ogun Valley Poultry Farms · Min. order 20 × crate of 30.
- The order page: cursor clicks "Pay ₦200,000 securely"; the status badge flips from "Awaiting payment" to "Paid · held in escrow"; the "Protected by AgriTrade escrow" card arrives.
- The buyer clicks "I received my order: release payment"; status turns "Completed"; the app's sprout success motif grows.

## Outro / punchline
Logo mark draws itself (leaves unfurl, as on the site), wordmark "AgriTrade", line: "Buy wholesale from Nigerian farms. Pay through escrow."

## User flow worth showing
Find a listing (product card) → pay into escrow (Pay button → "Paid · held in escrow") → confirm delivery to release payment ("Completed").

## Tone
- Preset: app-store
- Creative direction: market-day launch film — sunlit, warm, confident
- Interpretation: clean feature-card scenes with smooth slides, but warmed by real market photography, the green/earth palette and the sprout motif. No jokes; the escrow line is the payoff.

## Format: landscape — 1920x1080
## Duration: 21.5s

## Visual identity (from the project)
- Background: #faf7f0 (cream) and #173a26 / #0f2418 (deep greens)
- Accent: #2a6340 (primary green), #f2b544 (sun), #8cc152 (leaf), #c07a3a (earth)
- Text: #1b2a20 (ink), #f6ebdc on dark
- Display font: Fraunces
- Body font: Manrope
- Strongest visual element: the seedling logo mark + Sprout motif, real market photography, the status badges

## Data used on screen
All names come from the app's own sample seed data (`prisma/seed.ts`, rows marked `isSample`): FreshMart Supermarket (Ikeja, Lagos) and Ogun Valley Poultry Farms (Abeokuta, Ogun). No real users, emails, keys or hostnames. Order: 40 crates × ₦4,800 + ₦8,000 delivery = ₦200,000 (illustrative order built from the seeded listing price).

## Share copy (draft)
AgriTrade: Nigerian shops and restaurants buy produce wholesale straight from farms and fisheries, and the money sits in escrow until the buyer confirms delivery.

## Audio direction
- Role: warm bed
- Music: happy-beats-business-moves-vol-11 (warm, business-y; suits app-store)
- Music treatment: ~0.32 volume, short fade-in, 1.5s fade-out under the final logo
- Music cue guidance: bundled preset `assets/music/cues/happy-beats-business-moves-vol-11-by-ende-dot-app.music-cues.json`, 114.8 BPM. Strong cues to target: 1.60s (hook line 2), 12.65s (escrow status flip), 17.91s (outro logo). Beat grid ~0.53s apart: category chips in scene 2 may hit consecutive beats (texture, not reading text).
- Audio-reactive treatment: subtle; music RMS makes the warm sun-glow behind the logo/cards breathe. No waveform visuals.
- SFX posture: sparse, organic — soft wood/card sounds for placement, mouse click for simulated clicks, one bell for the payoff.
- Audio-coupled moments: product card landing, two cursor clicks, status flips, outro logo.
- Restraint rule: nothing harsh; SFX sit under the music; at most one bell.

## Storyboard

### Scene 1 — Hook — 0.0–3.2s (3.2s)
Yam market photo, slow push-in, deep-green scrim at bottom-left. "From the farm gate" (0.25s) / "to the supermarket shelf." (1.60s, beat-locked). Small photo credit.
Sequential/interaction: two lines arrive one after the other.
Audio intent: music starts; first impression warm and open.
Audio-coupled idea: soft wood tap as line two lands.
Transition mood: clean wipe → Scene 2

### Scene 2 — Reveal — 3.2–6.3s (3.1s)
Cream ground. Logo mark draws (stem, leaves unfurl), wordmark "AgriTrade" on 3.70s cue. Subline: "Wholesale farm produce across Nigeria." Category chips (Eggs, Poultry, Fish & seafood, Yam & tubers, Onions) pop in on consecutive beats as texture.
Sequential/interaction: chips one by one.
Audio intent: confident arrival.
Audio-coupled idea: soft drop on logo; very light ticks optional.
Transition mood: slide → Scene 3

### Scene 3 — Find it — 6.3–9.6s (3.3s)
Real ProductCard (eggs photo, "In stock" badge, category, title, price, meta rows) slides in at 6.34s. Left caption: "Buy straight from the farm." with eyebrow "1 · Find".
Sequential/interaction: card lands; cursor glides onto it.
Audio intent: tactile.
Audio-coupled idea: card-place on landing.
Transition mood: slide → Scene 4

### Scene 4 — Pay into escrow — 9.6–14.6s (5.0s)
Order page card: Order summary rows (40 × crate of 30, ₦192,000; delivery ₦8,000; Total paid into escrow ₦200,000), status badge "Awaiting payment", button "Pay ₦200,000 securely". Cursor clicks (~10.6s). Badge flips to "Paid · held in escrow" at 12.65s (beat-locked). "Protected by AgriTrade escrow" card slides in with the verbatim line "Buyers pay AgriTrade, not the seller." Eyebrow "2 · Pay".
Sequential/interaction: simulated click → status change.
Audio intent: the key moment; a satisfying confirmation.
Audio-coupled idea: mouse click; soft chime on status flip.
Transition mood: slide → Scene 5

### Scene 5 — Release — 14.6–17.9s (3.3s)
Buyer side: "I received my order: release payment" button, cursor click (~15.1s). Badge → "Completed". Sprout grows. Line: "We release the money only after the buyer confirms delivery." (verbatim). Eyebrow "3 · Confirm".
Sequential/interaction: click → completion.
Audio intent: resolution.
Audio-coupled idea: click + light success accent.
Transition mood: dip to deep green → Scene 6

### Scene 6 — Outro — 17.9–21.5s (3.6s)
Deep green ground with sun glow. Logo mark + "AgriTrade" lands on 17.91s cue. Line: "Buy wholesale from Nigerian farms. Pay through escrow." Music fades.
Audio intent: warm close.
Audio-coupled idea: single bell on logo.

**Music mood for this video:** upbeat, warm
**Audio summary:** a warm business bed carries the order from farm photo to escrow, with tactile clicks and one bell on the final logo.
