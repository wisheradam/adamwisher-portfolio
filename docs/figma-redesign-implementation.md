# AdamWisher.com Figma implementation review

PR #4 was already merged before this follow-up. This revision is based on that merged commit and does not merge or deploy anything.

Review branch: `feature/liquid-glass-controls`. Target: `main`.

This is a review-only implementation. No Figma layouts were edited, no production configuration or DNS was changed, and no merge or deployment was performed.

## Design source

Approved file: [Adam Wisher portfolio redesign](https://www.figma.com/design/lkL7HRzIdYIoQt5ZMd6Dxd/).

| Page | Source frame |
| --- | --- |
| Desktop home / light | [29:2039](https://www.figma.com/design/lkL7HRzIdYIoQt5ZMd6Dxd/?node-id=29-2039) |
| Desktop home / dark | [29:2204](https://www.figma.com/design/lkL7HRzIdYIoQt5ZMd6Dxd/?node-id=29-2204) |
| Mobile home / light | [29:1182](https://www.figma.com/design/lkL7HRzIdYIoQt5ZMd6Dxd/?node-id=29-1182) |
| Mobile home / dark | [29:1335](https://www.figma.com/design/lkL7HRzIdYIoQt5ZMd6Dxd/?node-id=29-1335) |
| Desktop supporting routes | Work 29:2369; About 29:2628; Education 29:2667; Contact 29:2895; public Projects 29:2940 |
| Components | Redesign / Components, page 25:787 |

The implementation uses design context, frame screenshots and the original repository content. The six diagrams use local SVG layers exported from the approved Work frame, with their labels retained as text. No raster screenshot is used to render the interface. Scalable SVG foreignObject wrappers preserve the authored diagram geometry at narrow widths.

## Scope

Next.js 15.5.24 App Router, React 19, TypeScript, Tailwind 3. Existing APIs, knowledge records, authentication, mail service and deployment configuration remain unchanged.

Updated public routes: `/`, `/work`, `/about`, `/education`, `/contact`, `/projects/login`, and all six existing `/work/*` case studies. `/projects` and `/projects/product-checker` retain their existing server protection; `/learning` retains its redirect. `/mail` retains its existing page and destination.

Shared components: identity/navigation, keyboard-accessible mobile dialog, footer/theme control, primary buttons, capsule, project cards and layered illustrations, course rows, form surfaces and focus/error treatments. Ask Adam remains connected to the same API contract. Contact retains validation, consent, honeypot, timing, phone reveal, success and failure handling.

## Visual and responsive implementation

- Inter 400/500/600 with system fallbacks; reference headline line breaks are explicit because browser/Figma font metrics differ.
- Desktop content width 1184px at 1440px, 128px outer margins, 64px major gaps. Hero padding 64px, radius 44px, headline 72/76.
- At 390px: 20px outer margins, 40px major gaps, hero padding 24px and radius 32px, headline 40/43. At 320px the headline reduces to 34/38.
- Three cards on desktop, two on tablet, one on mobile; diagrams scale together with their labels.
- Semantic light/dark tokens cover background, surfaces, glass, text, border, accent, on-accent, focus, errors, controls and disabled treatment. Stored `adam-theme` preference is preserved; the default for new visitors is light.
- Broad neutral/blue/lilac page gradient and milk-glass hero. More opaque reading/card surfaces. CSS fallbacks remove transparency when backdrop filtering is unavailable or reduced transparency is requested.
- Native modal menu with explicit Tab/Shift+Tab wrapping, Escape, and focus restoration. Skip link, visible focus outlines, labelled fields, live errors, keyboard-operable disclosures and reduced-motion handling.

## Validation

Run on the local optimized production build using Playwright Chromium headless and axe-core. Representative screenshots are in `docs/review/` (1440, 390, 320; light and dark).

- `npm run build`: passed; all existing routes compile. Home first-load JavaScript approximately 116kB.
- `npm run typecheck`: passed.
- `npm run lint`: passed without lint warnings/errors. Next.js emits its existing `next lint` deprecation notice.
- `npm run test:e2e`: 12 scenarios pass, covering every public portfolio route at 1440/390/320; no horizontal overflow; asset loading; CTA anchor; dark preference persistence; modal keyboard behavior; Ask Adam loading/error/success/focus; contact validation/error/success/phone reveal; education expansion; protected-route redirects; 768/1024/1180 intermediate widths; reduced motion; visible keyboard focus; actual local Ask Adam response.
- axe WCAG 2/2.1/2.2 A/AA checks: zero violations across the public route/viewport matrix and dark home. This is automated coverage, not a full accessibility certification.
- Existing `validate:ask-adam`: **79/80**. The unchanged knowledge/API logic cannot confidently answer “What degree does Adam have?” in local fallback mode. No portfolio facts were changed to manufacture a passing answer. API/data files have no diff from the base commit.
- No existing standalone unit-test suite was present. Real email delivery was not exercised; Contact tests intercept requests and send no mail. Production LLM credentials and successful private-login sessions were not available or requested.

## Intentional differences / review limits

The fourth existing Ask Adam suggestion, full original education/course content, contact help/email/phone controls, and Projects/Mail links remain available although some Figma frames simplify or omit them. Extra education detail is inside the existing disclosures. Work retains the original introductory sentence below its approved heading. These preserve existing content and functionality.

Input boundaries and keyboard focus use stronger contrast than the faint Figma decorative outlines. Empty Ask Adam submission is genuinely disabled, rather than appearing enabled as in the static frame. The responsive headline breaks match the visual reference while allowing further wrapping at compact widths.

Case studies inherit the approved shared type/color/surface system; separate approved case-study redesign frames were not present. Gradient appearance varies with page height. Native select/validation rendering and font antialiasing can differ by platform. Safari/iOS and Firefox have not been exercised here; a real-device pass remains advisable, particularly for the SVG foreignObject diagrams and reduced-transparency preference. Core Web Vitals were not measured in a production environment.

## Local review (no publication)

No existing repository preview integration was found. Use Node.js 20+ and the local production server:

```sh
git clone --branch feature/liquid-glass-controls https://github.com/wisheradam/adamwisher-portfolio.git
cd adamwisher-portfolio
npm ci
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Open **http://127.0.0.1:3000** on that computer. For live editing use `npm run dev` instead. Existing production credentials are not needed for visual review. Private access will correctly remain disabled when its existing environment configuration is absent; contact delivery requires its existing SES configuration.

To repeat browser checks:

```sh
npx playwright install chromium
npm run test:e2e
```

The test runner starts a local production server on port 3100 after `npm run build`. An installed Chromium/headless-shell executable can be selected with `PLAYWRIGHT_EXECUTABLE_PATH`. This environment used a temporary headless-shell binary at `/tmp/chromium`; it is not a repository dependency or deployment change.

Review home, Work, About, Education, Contact, the public Projects entry and a case study at 1440, 390 and 320px. Toggle theme, open the mobile menu with keyboard, expand a curriculum, and ask a professional-background question. Contact success/error is safely demonstrated by the mocked e2e test; clicking Send request outside tests uses the unchanged real API when credentials are configured.

**Stop at Draft PR. No merge. No production deployment. Live adamwisher.com remains unchanged.**

## Requested Liquid Glass revision

The owner requested a visual revision after the original Figma implementation: glass buttons and a renewed background/type comparison with the Natali Wisher screenshot. This instruction supersedes the original solid-blue button presentation; Figma itself remains untouched.

Controls now share a CSS Liquid Glass approximation: translucent tint, background blur/saturation, rounded lens edges, inset highlights, restrained shadow, hover/pressed/focus/disabled states, plus opaque fallbacks for reduced transparency, increased contrast and unsupported filters. Main actions, navigation, theme/menu controls and form actions use this treatment. Text suggestions and reading surfaces remain quiet standard materials. This follows the functional-layer distinction in [Apple HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials); it does not claim to reproduce Apple's native renderer or physical refraction.

Image sampling excluding browser chrome found a neutral patch of #E8EDF3 and a blue patch near #CADBF7, consistent with the approved #CCDBF8 palette within JPEG/gradient variation. Viewport-scaled first-screen radial fields now places blue light on the left and lilac at the lower right, instead of stretching one diagonal gradient over the entire long page. The top remains neutral. Dark uses separately chosen tokens.

Inter remains the approved practical typeface, with 500 headlines/control labels and 600 identity text. The exact font in the bitmap cannot be established reliably. Headline scale, tracking and responsive breaks remain intact; button labels now use a calmer medium weight. The screenshot's Safari UI is not part of the site.

### Higher-gloss control revision

Following the owner's approval of text and background, only the button material was intensified: clearer fill, brighter curved upper reflection, a hollow two-pixel refractive rim, lower return light, deeper contact/ambient shadows, and stronger hover depth. Light and dark use separate optical tokens. Decorative layers remain behind labels and ignore pointer events. Both optical layers disappear for reduced transparency/increased contrast and unsupported backdrop filters. Approved background and typography values are unchanged by this revision.


### Clear Dock-style glass

The owner supplied an iOS Dock reference and requested maximum transparency. Removed the broad milky highlight and dense tint: the light control fill is now 2.5–4.5% and the dark fill 8–12%; these are tint-layer alpha values, not overall rendered opacity. Background blur is reduced to 5px. Reflections are confined to narrow edge regions, preserving a transparent center while retaining the glossy rim and volume. Text, page gradient and layout remain unchanged. The effect is CSS glass, not the native iOS Dock renderer.


### Clear polished lens revision, 12 November 2026

Based on the owner's Apple glass-controls and transparent iOS Dock references, the lens center now has only a 0.8% neutral / 1.5% primary tint in light mode and 2.5% / 4% in dark mode. These describe the fill layer only, not final pixel opacity. Removed the broad face gradients, reduced backdrop blur to 2px, and concentrated highlights on a masked 3px lip with alternating light/dark bands, corner glints and a lower return reflection. Labels, geometry, approved page gradients and font settings retain their previous values. Hover uses the same thin specular treatment. Reduced-transparency, increased-contrast and unsupported-filter fallbacks remain opaque. This remains a CSS approximation without native optical refraction.

Validation for this revision: optimized `npm run build` passed, including lint and type validation; CSS parser and whitespace checks passed; approved light/dark page gradient definitions compared unchanged. Browser visual QA could not run: the managed preview launcher adds `--host` and `--strictPort`, which this Next.js CLI rejects. No alternate browser path was used. Existing screenshots and the 12/12 browser result above describe earlier revisions and must not be presented as evidence of this latest material. Physical iOS/Safari review is still outstanding. Draft PR only; no merge or deployment.
