# Landing Brief Reset Design

## Purpose

Reset the public homepage so Showman no longer feels like a styled CRUD app. The landing page should become the first product interaction: a culture-native front door where a booker describes a gig, Showman turns that intent into structured booking terms, and artists/teams see that the platform is serious enough for money, contracts, availability, and professional operations.

This pass covers the public landing page only. It should prepare the path for the larger **Describe the Gig + Roster HQ + Book the Window** product spine without trying to build the full booking engine yet.

## Taste Diagnosis

The current homepage has strong copy but weak composition. It uses a familiar dark SaaS split hero: headline on the left, decorative card on the right, two buttons underneath. That pattern reads as generated because it could belong to any marketplace or booking tool. It does not carry music culture, live booking tension, or a memorable product moment.

The reset should remove the feeling of boxed panels as decoration. It should use space, motion, photography, editorial scale, and one signature interaction to make the page feel alive.

## Visual Thesis

A living backstage command desk for new music scenes: dark but not suffocated, editorial but not fashion, raw but trustworthy enough for booking money and contracts.

The page should feel like it belongs to the people putting on shows, building scenes, managing artists, and pushing culture forward. It should not feel anti-manager, anti-agent, or like a generic creator marketplace.

## Signature Interaction

The signature element is a **living booking brief**.

At the top of the page, the user sees a plain-language prompt such as:

> Need a DJ for a warehouse show in Berlin, mid-Oct, around €8k.

The brief visually resolves into structured chips:

- `Berlin`
- `mid-Oct`
- `90 min`
- `€8k`
- `travel covered`
- `verified artist teams`

Around the brief, small fragments of product state should move or reveal: artist/media tiles, availability windows, request cards, and fit signals. The message is immediate: Showman turns messy intent into booking infrastructure.

The brief does not need to submit real booking data in this pass. It can be an interactive visual prototype on the landing page, but it should be built in a way that later connects to actual parsing/matching.

## Content Architecture

### 1. Hero: Brief First

The first viewport should not be a split hero with a decorative card. It should be composed around the living booking brief.

Required elements:

- Brand/navigation.
- One headline with the existing voice direction: booking infrastructure for the next wave of live culture.
- Plain-language brief input or input-like surface.
- Structured chips that appear as the brief resolves.
- Primary CTA: `Start a request`.
- Secondary CTA: `Set up artist workspace`.
- A subtle signal that full artist details are controlled, not publicly exposed.

Avoid:

- Generic dashboard preview cards.
- Fake stats.
- "No middleman" language.
- Explaining the UI inside the UI.

### 2. Scene Strip

Below the hero, show dev-only artist/media examples to bring life into the surface. The user approved temporary development examples using ASAP Rocky, Fakemink, and PinkPantheress in that order, but these must be treated as placeholder-only and never production launch material.

If exact local image files are not available, the implementation should use controlled placeholder blocks and clear developer notes rather than shipping remote celebrity image URLs.

Public scene cards should show vibe and teaser-level category only. They must not expose private profile details, availability, booking terms, location specificity, or contact paths for real artists.

### 3. How It Works

Use the wireframe spine:

1. Describe the gig.
2. Match real artist teams.
3. Request a window.

This section should be concise and product-like. It should not sound like a startup explainer. The copy should stay concrete: brief, terms, teams, windows, request.

### 4. Two Doors

The landing page should route two different audiences without making either feel secondary:

- `I’m booking` — starts from the brief/request motion.
- `I’m an artist or team` — starts from workspace setup and controlled availability.

This should be one composed section, not two generic cards. The split should feel like choosing a side of the booking table.

### 5. Trust Without Sterility

Close with a trust section that explains what Showman protects:

- Real artist identity and team authority.
- Controlled access to booking-sensitive details.
- Availability windows that can become holds.
- Booking rails that can support contracts and payments later.

This section should feel serious, not corporate. It should pair raw voice with concrete promises.

## Interaction And Motion

Use motion deliberately and sparingly.

Required motion:

- Fluid orange cursor/light interaction over the hero or brief zone.
- Hero brief chips resolving on load or hover/focus.
- Scroll reveal for scene strip and workflow sections.

Optional motion:

- Subtle marquee or ticker for live booking fragments.
- Image hover that feels photographic/editorial, not bouncy.

Respect `prefers-reduced-motion`. The page must still read correctly with motion reduced.

## Visual System Direction

### Palette

Keep the orange lane but make it sharper and less blanket-like.

- Obsidian: `#080807`
- Stage black: `#11100e`
- Bone: `#fff8ec`
- Muted bone: `#b8ad9d`
- Signal orange: `#ff6a00`
- Soft ember: `#ffb06a`

Orange should feel like a live signal: cursor light, chip active state, CTA, parsed term. It should not fill every container.

### Typography

The current system font stack is build-safe but too neutral for a final design. For this pass, do not reintroduce remote font fetching. Instead, use the available system stack with stronger composition and prepare the design for a future local display font decision.

Type treatment:

- Hero headline: oversized, uppercase, tight but not cramped.
- Brief text: large, plain, human, closer to a command/input than a marketing line.
- Utility labels: small uppercase with wider spacing, used only where they encode product state.

### Layout

Use fewer framed boxes. Cards should only exist when they are interactive objects: a request fragment, artist teaser, chip group, or route choice. Sections should feel full-width and spatial, not like nested panels.

Mobile must be first-class. The brief should remain the central object on mobile, not collapse into a stack of generic cards.

## Access-Control Implications

The landing page may create desire and explain the marketplace, but it must not expose real artist booking details to anonymous visitors.

Public can see:

- Brand message.
- Dev-only/sample artist visual references.
- High-level genres or scene descriptors.
- Product process.

Public must not see:

- Real artist availability windows.
- Private markets/locations for actual profiles.
- Booking terms, fees, travel requirements, notes, or team/contact details.
- Full profile pages for real artists.

The public/private artist access change can be implemented in a later pass, but the landing page should not add new leaks.

## Technical Scope

This landing reset should touch:

- `web/app/page.tsx`
- `web/app/globals.css`
- New landing-specific client component(s), if needed, under `web/components/landing/`
- New dev/sample data module, if needed, under `web/lib/`
- `docs/BUILD-JOURNAL.md`

This pass should not:

- Add new database tables.
- Add paid or network-dependent design assets.
- Add a public booking API.
- Add production celebrity likenesses.
- Rebuild the signed-in workspace.

## Verification

Required verification:

- Typecheck.
- Lint.
- Production build.
- Playwright screenshot pass at desktop and mobile widths for `/`.
- Playwright console/page-error check.
- Reduced-motion sanity check if feasible.

Visual acceptance:

- The first viewport should no longer read as a generic dark SaaS split hero.
- The brief should be the memorable product moment.
- The page should have scroll depth and visible next-section affordance.
- Text should not overlap or feel cramped on mobile.
- Public copy should preserve the approved voice and avoid "democratize," "no middleman," and anti-agent framing.

## Open Decisions Before Implementation

- Whether the development artist imagery will be supplied as local files under `web/public/dev-artists/`.
- Whether the first landing reset should keep the current `Browse artists` route visible in nav before public/private access is redesigned.
- Whether to use a static brief prototype or a small client interaction where users can edit the text and chips update from a fixed parser.

Recommended default: build a small client interaction with fixed parsing rules for the demo phrase. It is more memorable than a static mock and can later evolve into the real Describe the Gig flow.
