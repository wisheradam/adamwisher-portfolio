# Editable desktop design in Figma

[Open the Figma Design file](https://www.figma.com/design/lkL7HRzIdYIoQt5ZMd6Dxd)

This file recreates the public desktop UI of [adamwisher.com](https://adamwisher.com/) as observed on 12 November 2026. It is a design handoff for the existing website, rather than a new website implementation.

## Screens

All frames are 1440 px wide. The content container is 1184 px wide.

| Route | Figma frame | Node ID |
| --- | --- | --- |
| `/` | Home · Desktop 1440 | `3:45` |
| `/about` | About · Desktop 1440 | `6:136` |
| `/work` | Work · Desktop 1440 | `8:331` |
| `/education` | Education · Desktop 1440 | `9:365` |
| `/contact` | Contact · Desktop 1440 | `8:579` |
| `/projects/login` | Projects · Desktop 1440 | `9:978` |

The Projects frame represents the public sign-in screen reached from `/projects`; it does not contain private workspace data. Individual case-study detail pages and mobile layouts are outside this handoff.

## File organization

- **01 · Desktop — Live website** contains the six desktop frames.
- **02 · Components — Website** contains reusable component masters.

The homepage is organized into Header, Hero, Ask Adam, Selected work, and the bottom More work CTA. About and experience content lives in the separate About frame, matching the website's routing. The source homepage has no standalone footer; no additional footer content was invented.

Text remains editable. Project illustrations use separate vector shapes and editable labels, rather than flattened page screenshots. Related elements use Auto Layout, and source colors, spacing, radii, and typography are represented through tokens and styles.

## Reusable components

- Navigation link
- Expertise tag
- AI suggestion button
- More work button
- Six project-card components reused between Home and Work
- Inner-page header
- Empty text input
- Training row, used by 48 course entries
- Course-category heading with separate editable title and count

Training-row properties include title, provider, date, optional description, and an exam-preparation badge. Education accordions match their collapsed initial state; expanded content is retained in hidden editable layers.

## Source styling

| Token | Dark value |
| --- | --- |
| Background | `#050505` |
| Foreground | `#F4F4F5` |
| Secondary text | `#A1A1AA` |
| Border | `#2A2A2D` |
| Surface | `#0E0E10` |
| Accent | `#3B82F6` |

The UI uses Inter for body text, Space Grotesk for display text, and IBM Plex Mono for metadata. Illustration labels use available editable font equivalents where the SVG's generic font is unavailable.

## Validation and maintenance

The design was compared with the live public pages. Corrections included Auto Layout sizing, SVG-label scaling, project-card text wrapping, form geometry, and collapsed education content. The final structural check found no visible text extending outside the six desktop frames and no flattened image fills in those frames.

The Figma file is a point-in-time design reference. Repository changes and Figma edits are not automatically synchronized. Update this handoff when the screen inventory or canonical design file changes. Interactions such as authentication, Ask Adam, and form submission remain implemented by the website; the Figma frames document their appearance.
