---
name: TradeCraft Monochrome Ledger
colors:
  background: '#09090B'
  on-background: '#FAFAFA'
  surface: '#09090B'
  surface-dim: '#09090B'
  surface-bright: '#27272A'
  surface-container-lowest: '#09090B'
  surface-container-low: '#111113'
  surface-container: '#18181B'
  surface-container-high: '#202023'
  surface-container-highest: '#27272A'
  on-surface: '#FAFAFA'
  on-surface-variant: '#A1A1AA'
  inverse-surface: '#F4F4F5'
  inverse-on-surface: '#18181B'
  outline: '#52525C'
  outline-variant: '#3F3F46'
  surface-tint: '#E4E4E7'
  primary: '#E4E4E7'
  on-primary: '#18181B'
  primary-hover: '#FFFFFF'
  primary-container: '#27272A'
  on-primary-container: '#FAFAFA'
  secondary: '#27272A'
  on-secondary: '#FAFAFA'
  secondary-hover: '#3F3F46'
  tertiary: '#3B82F6'
  on-tertiary: '#FFFFFF'
  card: '#18181B'
  card-foreground: '#FAFAFA'
  popover: '#18181B'
  muted: '#27272A'
  muted-foreground: '#A1A1AA'
  subtle-foreground: '#71717B'
  accent: '#27272A'
  border-alpha: rgba(255, 255, 255, 0.10)
  input-alpha: rgba(255, 255, 255, 0.15)
  ring: '#71717B'
  overlay: rgba(9, 9, 11, 0.60)
  profit: '#22C55E'
  profit-container: '#052E1A'
  on-profit-container: '#4ADE80'
  profit-border: rgba(34, 197, 94, 0.30)
  loss: '#FF6467'
  loss-container: '#3B0A0C'
  on-loss-container: '#FF8A8C'
  loss-border: rgba(255, 100, 103, 0.30)
  warning: '#FBBF24'
  warning-container: '#3A2205'
  on-warning-container: '#FB923C'
  warning-border: rgba(251, 191, 36, 0.30)
  info: '#3B82F6'
  info-container: '#0B1E4A'
  on-info-container: '#93B4FF'
  error: '#FF6467'
  on-error: '#3B0A0C'
  chart-1: '#FAFAFA'
  chart-2: '#A1A1AA'
  chart-3: '#71717B'
  chart-4: '#3F3F46'
  chart-5: '#27272A'
typography:
  display-xl:
    fontFamily: Geist
    fontSize: 56px
    fontWeight: '500'
    lineHeight: 60px
    letterSpacing: -0.03em
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 38px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.01em
  card-title:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0px
  body:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0px
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0px
  button:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0px
  stat-numeral:
    fontFamily: Geist Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  table-data:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0px
  badge:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  micro-label:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.625rem
  lg: 0.875rem
  xl: 1rem
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px
---

## Brand & Style

TradeCraft is a trading journal and analytics workstation for discretionary traders who review their own execution. The visual direction is a quiet, near-black instrument panel: monochrome chrome, hairline structure, and colour that appears only when it carries meaning. The design should feel like a well-tuned shadcn/ui build taken one step further, dense enough for review sessions and calm enough for long ones.

### Aesthetic Philosophy
- **Monochrome Chrome:** Navigation, buttons, cards, inputs, and tabs are rendered entirely in the zinc scale. The primary action is a soft off-white button on a dark floor, not a coloured one. Hierarchy comes from luminance, weight, and spacing.
- **Colour Is Data, Never Decoration:** Green, red, amber, and blue are reserved for trading semantics: profit, loss, at-risk or caution, and informational or in-progress states. If a colour does not answer "is this good, bad, risky, or active?", it does not belong on the screen.
- **Sentence-Style Information:** Feeds and logs read as sentences with three tones: the actor or instrument in bright ink, the verb in muted ink, the object or value in bright ink again. Example: **EURUSD** *closed long at* **+2.4R**.
- **Instrumental Typography:** A neutral geometric sans carries narrative, labels, and headings. A monospace carries every number, timestamp, ticker, and status chip so figures align and never jitter during live updates.
- **Planar Depth:** No drop shadows. Two flat surface tiers separated by alpha hairlines. Overlays use a dimmed floor and a single hairline-bound plane.
- **Soft Geometry:** Generous radii on containers and full pills on status chips, contrasted with rigid grid alignment and tabular numerals.

## Colors

### Canvas Surfaces & Foreground
- **Floor (`#09090B`):** Base plane for every page viewport and the inside of the search field wrapper.
- **Card / Surface (`#18181B`):** Elevated plane for cards, kanban columns, popovers, modals, inputs, and the navigation rail.
- **Surface Accent (`#27272A`):** Neutral interactive backing for hover states, secondary buttons, segmented-control active fill, and neutral badges.
- **Foreground (`#FAFAFA`):** Headlines, instrument names, values, and active text.
- **Muted Foreground (`#A1A1AA`):** Verbs in feed sentences, metadata, field labels, and inactive tab text.
- **Subtle Foreground (`#71717B`):** Placeholders, disabled text, and axis tick labels.

### Primary Action
- **Primary (`#E4E4E7`) with text `#18181B`:** The single high-contrast action on a view (Buy, Sell confirm, Save trade, Default modal button). Hover lifts to `#FFFFFF`.
- Only one primary button per surface. Everything else is secondary, outline, or ghost.

### Trading Semantics
Semantic colours always appear as a triad: a saturated foreground for the numeral or track fill, a deep tinted container for chips, and a 30 percent alpha border.
- **Profit (`#22C55E`):** Positive P&L, winning trades, completed checklists, success icon tiles (icon `#4ADE80` on `#052E1A`).
- **Loss (`#FF6467`):** Negative P&L, stopped-out trades, destructive actions, drawdown breaches.
- **Warning (`#FBBF24`):** At-risk trades, rule near-violations, approaching daily loss limit. Chip text uses `#FB923C` on `#3A2205`.
- **Info (`#3B82F6`):** In-progress, open positions, early-stage progress fills, and neutral notifications.

Rules:
- Never use colour alone; pair it with a sign (`+` / `-`), an icon, or a text label so colour-blind traders can read outcomes.
- Never tint an entire card with a semantic colour. Colour appears on the numeral, the progress fill, the chip, or the icon tile.

### Structural Hairlines
Do not use solid grey hex borders on dark surfaces. Borders use white alpha:
- **Structural Border (`rgba(255, 255, 255, 0.10)`):** Cards, columns, table rules, dividers, outline buttons, tab groups.
- **Control Border (`rgba(255, 255, 255, 0.15)`):** Text inputs, selects, checkboxes, and search fields. Transitions to a `1px` `#71717B` ring on focus.
- **Timeline Rail (`rgba(255, 255, 255, 0.10)`):** The `1px` vertical connector between avatars in activity feeds.

### Data Visualisation Ramp
Charts default to the achromatic zinc ramp so that semantic colour retains its meaning when it appears:
- Level 1 (`#FAFAFA`): Dominant series, equity line, peak value.
- Level 2 (`#A1A1AA`): Secondary series, benchmark.
- Level 3 (`#71717B`): Baseline comparison.
- Level 4 (`#3F3F46`): Inactive or historical cohort.
- Level 5 (`#27272A`): Gridlines, empty tracks, backdrop fills.

Exceptions where semantic colour is allowed inside charts: P&L bars or calendar cells (profit and loss), drawdown fills (loss), and win-rate or win-probability progress tracks (info, warning, profit by threshold).

## Typography

### Font Role Allocation
1. **Geist (Structural Narrative):**
   - Page titles, section headers, card titles, prose, button labels, tab labels, feed sentences.
   - Display sizes use negative tracking (`-0.01em` to `-0.03em`) for the tight, editorial headline look; body sizes use `0`.
2. **Geist Mono (Technical Metadata & Telemetry):**
   - Prices, lot sizes, R-multiples, P&L, percentages, tickers, timestamps, session tags, badges, table cells, keyboard hints.
   - Tabular figures are mandatory so live-updating values do not shift layout.

### Micro-Copy Formatting Rules
- All `micro-label` instances are uppercase with `0.06em` tracking.
- Numbers in tables and stat tiles align right and share uniform column widths.
- Signed values always show their sign: `+1,240.50`, `-320.00`, `+2.4R`.
- Relative timestamps (`10 mins ago`, `2 mins ago`) sit right-aligned in `caption` Geist Mono, muted.
- Keyboard hints render as `micro-label` inline glyphs (`⌘ K`, `Opt + ⌘`) in muted ink.

## Layout & Spacing

The layout is built on a rigid **4px base rhythm**. All margins, paddings, gaps, and dimensions resolve to multiples of 4px.

### Grid & Composition Engine
- **Global Architecture:** Fixed 240px navigation rail (collapsible to a 64px icon rail) on `#18181B`, paired with a fluid canvas on the `#09090B` floor (`max-width: 1600px`).
- **Marketing / Landing Shell:** Centered floating pill navigation on `#18181B` with a hairline, a right cluster of search (`/` shortcut hint), ghost link, and primary button, then a centered hero column (`max-width: 720px`) on the floor.
- **Dashboard Grid:** 12-column fluid grid, `24px` (`lg`) gutters on desktop, `16px` (`md`) on tablet.
- **Card Interior Padding:** `16px` (`md`) for dense trade cards and stat tiles, `24px` (`lg`) for regular cards and modals.
- **Kanban / Pipeline Boards:** Columns are `288px` wide with `12px` (`sm`) inner padding and `12px` between cards. Column headers hold a drag handle, a coloured status dot, the title, a mono count, a right-aligned mono aggregate (for example net R or total P&L), and a `+` ghost icon button.
- **Feeds and Logs:** Full-width stacks, `24px` between entries, `12px` avatar-to-text gap.

### Breakpoint Matrix
- **Mobile (< 768px):** 1-column stack. Sidebar becomes an off-canvas drawer. Kanban columns scroll horizontally with snap. Outer padding `16px`.
- **Tablet (768px - 1024px):** 6-column grid with the 64px collapsed rail. Outer padding `24px`.
- **Desktop (> 1024px):** Full 12-column grid with the expanded 240px rail. Outer padding `32px` (`xl`).

## Elevation & Depth

No blurred drop shadows. Depth is tonal stacking plus alpha hairlines.

### The Two-Tier Surface Hierarchy
- **Level 0 (Floor):** Solid `#09090B`. Page viewport and structural scaffolding.
- **Level 1 (Elevated Planes):** Solid `#18181B`. Cards, columns, popovers, dropdowns, modal dialogs, the navigation rail, and inputs.

### Overlay Behaviour
- Modal backdrop is the floor dimmed with `rgba(9, 9, 11, 0.60)`. The dialog is a Level 1 plane with a `1px` structural hairline.
- Modal footers may sit on a slightly lifted band (`#202023`) separated by a hairline, holding the action buttons at equal widths.
- Horizontally scrolling boards fade out at the trailing edge with a `48px` gradient from transparent to `#09090B` to signal more columns.

### Hairline Delimitation
- **Card Framing:** `1px solid rgba(255, 255, 255, 0.10)` against the floor.
- **Active Controls:** Inputs use `1px solid rgba(255, 255, 255, 0.15)`, moving to a `1px` `#71717B` ring on focus.
- **Avatars:** Overlapping avatars keep clearance with a `2px` border matching the underlying card (`#18181B`).

## Shapes

Radii scale with component mass:

- **Status Chips & Pills (`9999px`):** Badges, region and session tags, count pills, progress tracks and fills, radio selectors, switch hulls, avatars.
- **Compact Nodes (`6px`):** Keyboard-hint keys, inline icon tiles, table chips.
- **Interactive Controls (`8px`):** Buttons, text inputs, search, selects, command palette items, individual segments in a segmented control (outer group uses `8px`).
- **Icon Tiles (`10px`):** The square tinted icon holder in modal headers (40px square).
- **Containers (`14px`):** Trade cards, stat tiles, settings pods, feed cards, dropzones.
- **Large Containers (`16px`):** Kanban columns and modal dialogs.

## Components

### Buttons
Height `36px` (compact `32px`), padding `8px 16px`, `14px / 500` Geist, radius `8px`.
- **Primary (Default):** Background `#E4E4E7`, text `#18181B`, no border. Hover `#FFFFFF`.
- **Secondary:** Background `#27272A`, text `#FAFAFA`, border `1px solid rgba(255, 255, 255, 0.10)`. Hover `#3F3F46`.
- **Outline:** Transparent, text `#FAFAFA`, border `1px solid rgba(255, 255, 255, 0.10)`. Hover background `#27272A`.
- **Ghost:** Transparent, text `#A1A1AA`, no border. Hover background `#27272A`, text `#FAFAFA`.
- **Destructive:** Background `#3B0A0C`, text `#FF8A8C`, border `1px solid rgba(255, 100, 103, 0.30)`. Used for close-position and delete.
- **Icon Button:** `32px` square ghost with a `16px` icon.
- Modal footers pair an Outline and a Primary button at equal width, Outline on the left.

### Input Fields & Controls
- **Text Input / Search:** `36px` height, `8px 12px` padding, background `#18181B`, border `1px solid rgba(255, 255, 255, 0.15)`, radius `8px`, text `#FAFAFA` `14px` Geist, placeholder `#71717B`. Search fields span the full container width and use an ellipsis placeholder (`Search...`).
- **Numeric Inputs (price, size, stop, target):** Same shell, value in Geist Mono, right-aligned, with a muted unit suffix.
- **Checkboxes:** `16px` box, `6px` radius, border `rgba(255, 255, 255, 0.15)`. Checked: background `#E4E4E7`, check `#18181B`.
- **Radio Buttons:** `16px` circle, same border. Selected shows an inner `#E4E4E7` core.
- **Toggle Switches:** `36px x 20px` pill, `2px` inset. Inactive track `#27272A`, active track `#E4E4E7`, thumb `16px` circle (`#FAFAFA` inactive, `#18181B` active).
- **Segmented Control / Filter Tabs:** A single hairline-bound group, `32px` tall, radius `8px`, segments separated by `1px` alpha dividers. Each segment holds an optional `16px` icon and a `14px / 500` label. Active segment: background `#18181B` with bright text. Inactive segments: background `#202023`, muted text. Used for filters such as `All trades`, `Long`, `Short`, `Journal`, `Reviews`.

### Badges & Chips
Geist Mono `12px / 500` (`11px` for dense), padding `2px 10px`, fully rounded pill.
- **Neutral:** Background `#27272A`, text `#FAFAFA`, no border. Example: `New`, `Working`, `On track`.
- **Outline:** Transparent, text `#A1A1AA`, border `1px solid rgba(255, 255, 255, 0.10)`. Used for session, region, and instrument tags (`LONDON`, `NY AM`, `EURUSD`, `NA-East`).
- **Leading-Icon Chip:** Outline chip with a `12px` icon (paperclip, calendar, check-circle) followed by a label. Used under feed entries as the attachment or outcome object.
- **Profit:** Background `#052E1A`, text `#4ADE80`, border `1px solid rgba(34, 197, 94, 0.30)`. Example: `Target hit`, `All rules followed`.
- **Loss:** Background `#3B0A0C`, text `#FF8A8C`, border `1px solid rgba(255, 100, 103, 0.30)`. Example: `Stopped out`.
- **Warning:** Background `#3A2205`, text `#FB923C`, no border. Example: `At risk`, `Rule breach`.
- **Info:** Background `#0B1E4A`, text `#93B4FF`. Example: `Open`, `Pending`.
- **Status Dot:** `8px` circle in a semantic or zinc colour, placed before column titles and live-status labels.

### Progress Tracks
- Track: `4px` tall, fully rounded, `#27272A`. Fill is fully rounded.
- Label row above the track: muted label left, mono percentage right (`Win prob.` / `Setup score`, `48%`).
- Fill colour reflects a threshold: `#3B82F6` for early or low, `#FAFAFA` for neutral or mid, `#FBBF24` for at-risk, `#22C55E` for strong or complete.

### Cards & Dropzones
- **Card Container:** Background `#18181B`, `1px solid rgba(255, 255, 255, 0.10)`, radius `14px`, padding `24px` (`16px` when dense). Card titles `14px / 600` (or `16px / 600` for large cards).
- **Dropzone Target (screenshot and chart-image upload):** Background `#18181B`, `1px dashed rgba(255, 255, 255, 0.10)`, radius `14px`, padding `40px`, helper text `13px` Geist in `#A1A1AA`.

### Trade Card (Kanban Item)
The primary unit on the trade pipeline board (Watching, Setup, Open, Review).
- **Header:** `32px` avatar or instrument glyph (circle), then a two-line block: instrument or setup name (`card-title`, bright) and a muted `caption` subline in the form `Setup type · Session` (for example `Silver Bullet · NY AM`).
- **Progress Row:** Setup score or win probability as described under Progress Tracks.
- **Meta Rows:** Each row is a `16px` muted line icon plus a mono value, `12px` vertical rhythm. Rows: location or session (with an outline tag right-aligned, for example `LONDON`), date, and monetary or R value (`$5,800`, `+2.4R`).
- **Footer:** A status chip left, a muted `caption` tag right (for example `Journal tracked`).
- Cards stack with `12px` gaps inside a column. The last visible card may be clipped by the viewport; content fades naturally with the board edge fade.

### Activity Feed / Trade Log
- **Title:** `display-md` (`24px / 500`), followed by a full-width search input and a segmented filter group, each separated by `16px`.
- **Entry Layout:** Left column holds a `32px` avatar (image or initials on `#27272A`, initials in `#A1A1AA`), connected to the next entry by the `1px` timeline rail. Right column holds the sentence line and, below it, a leading-icon chip.
- **Sentence Line:** Actor in `16px / 500` bright, verb in `16px / 400` muted, object in `16px / 400` bright. Relative timestamp right-aligned in muted mono.
- **Example:** **EURUSD** *hit take profit on* **London Open Long** with a `+2.4R` profit chip and a `Chart.png` attachment chip.

### Modal Dialog
- Width `448px` (max `92vw`), background `#18181B`, `1px` structural hairline, radius `16px`.
- **Header:** `24px` padding. A `40px` icon tile (radius `10px`, semantic container background, `1px` alpha border, `18px` centred line icon), then a title (`14px / 600`) and a muted `13px` description. A ghost close icon sits top-right.
- A full-width hairline separates header from body. Body is free-form content with a minimum height of `200px`.
- **Footer:** Hairline top rule on a slightly lifted band (`#202023`), `16px` padding, two equal-width buttons (Outline, Primary). Confirm-trade and close-position dialogs use a profit or loss icon tile to state intent.

### Data Tables & Lists
- **Rows:** Minimum height `44px`, background `#18181B`, separated by `1px solid rgba(255, 255, 255, 0.10)`.
- **Cells:** Numeric and ticker values in `13px` Geist Mono, right-aligned for numbers. Header row uses `micro-label` in `#A1A1AA`.
- **P&L Cells:** Signed mono values coloured `#22C55E` or `#FF6467`, never with a tinted row background.
- **Row Hover:** Background `#202023`.

### Stat Tiles
- Padding `16px`, radius `14px`. A `micro-label` title in muted ink, a `stat-numeral` value, and an optional signed delta chip. Net P&L, win rate, average R, profit factor, and max drawdown are always shown in this format.

### Charts
- Equity curve: `2px` line in `#FAFAFA`, area fill fading from `rgba(250, 250, 250, 0.08)` to transparent, `#27272A` gridlines, mono axis labels in `#71717B`.
- P&L calendar: cells on `#18181B`, with profit cells in a `#052E1A` to `#22C55E` ramp and loss cells in a `#3B0A0C` to `#FF6467` ramp. Zero-trade days stay `#18181B` with a hairline.
- Distribution and allocation charts follow the achromatic zinc ramp.
- Tooltips use the Level 1 surface, a hairline, `12px` Geist Mono text, and no shadow.

### Navigation
- **Sidebar Rail:** `#18181B`, right hairline. Items are `36px` tall, `8px` radius, `16px` icon and `14px / 500` label. Active item: background `#27272A`, bright text. Inactive: muted text, hover background `#202023`. Count badges use the Neutral chip in mono.
- **Floating Pill Nav (marketing pages):** `#18181B` pill with a hairline, `12px 16px` padding, items in `14px / 500` bright text, evenly spaced with `24px` gaps.
- **Announcement Bar:** Centered single line with a small blue status dot and a `New` label, followed by muted copy. `13px` Geist on the floor.
