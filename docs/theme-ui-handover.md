# Theme and UI handover

Read this before changing layout, color, type, motion, or any component that a visitor can see. The site is a single-page portfolio. Copy lives in `content.ts`. Visual rules live here and in the files listed below.
This is not a mood board. If a change would look at home on a SaaS landing page (soft shadows, 12px radii, gradients, `font-bold` display type), it is wrong for this site.

## What it should feel like

Editorial technical document, not a product marketing page. Tight type, square-ish corners, one cyan accent, no decoration that does not carry information. Light and dark are equal peers. Dark is the boot fallback, not the only designed mode.
The only pictorial element is a Three.js earth on large screens, masked to the right edge. Everything else is type, 1px borders, and cyan.

## Source of truth

| What                  | Where                                                          |
| --------------------- | -------------------------------------------------------------- |
| Color and type tokens | `app/globals.css`                                              |
| Font loading          | `app/layout.tsx`                                               |
| Theme persistence     | `lib/theme.ts` plus the inline boot script in `app/layout.tsx` |
| Page composition      | `app/page.tsx`                                                 |
| Layout grid           | `components/Section.tsx`, `components/SectionHeader.tsx`       |
| Shared primitives     | `components/Tag.tsx`, `components/Reveal.tsx`                  |
| Theme control         | `components/ThemeToggle.tsx`                                   |
| Desktop globe         | `components/CoreBackdrop.tsx`, `components/EarthHorizon.tsx`   |
| Copy                  | `content.ts`                                                   |

Do not introduce a second token file, a `tailwind.config` color map, or `dark:` color utilities. Tokens swap on `html.light` / `html.dark`. Tailwind v4 maps them in `@theme inline`.
`project-visuals.ts` is unused inventory for project images. The live Projects grid is text-only cards. Do not start rendering those images unless a later pass explicitly asks for them.
`docs/seo-deferred.md` mentions `#0a0a0f` and `#00B4D8` for a future Open Graph image. Those are not page tokens. Do not copy them into `globals.css`.

## Color

CSS variables on `html.light` and `html.dark`. Tailwind names are the `--color-*` aliases.
| Token | Light | Dark | Tailwind |
| --- | --- | --- | --- |
| `--background` | `#f3f4f7` | `#101018` | `bg-background` |
| `--foreground` | `#14141c` | `#f4f4f6` | `text-foreground` |
| `--muted` | `#5c5c6a` | `#b4b4be` | `text-muted` |
| `--border` | `#c8cad3` | `#3e3e4a` | `border-border` |
| `--accent` | `#0891b2` | `#33c4e0` | `text-accent`, `bg-accent`, `border-accent` |
| `--accent-soft` | accent at 16% | accent at 18% | `bg-accent-soft` |
| `--surface` | `#ffffff` | `#1a1a24` | `bg-surface` |
Neutrals are cool gray with a slight blue. Accent is cyan. There is no second brand color, no success/warning/error palette, no gradient fills.
Opacity on foreground is allowed for body hierarchy: `text-foreground/90` for card body, `text-foreground/80` for secondary lines (company, school). Do not invent new opacities without a reason.
Selection uses `accent-soft` on `foreground`. Focus-visible is a 1px `accent` outline with 3px offset. Do not replace that with a ring utility.
Hard-coded hex is allowed only inside `EarthHorizon.tsx` (globe material and lights). If accent changes, update those hex values so the globe still matches.

## Type

Two families, loaded in `app/layout.tsx`:

- Inter → `--font-inter` → `font-sans`. Body, headings, hero name, mobile nav labels.
- JetBrains Mono → `--font-jetbrains-mono` → `font-mono`. Labels, nav, buttons, dates, stack lines, contact values.
  `body` is `font-sans`. `html` is `antialiased`.

### Display

Hero name is the only oversized type:

```
text-[clamp(4.25rem,16vw,7.5rem)] leading-[0.88] font-medium tracking-tight text-foreground
```

Not `font-bold`. Not a gradient fill. A 1px × 4rem (`h-px w-16`) accent rule sits under the name.
Mobile overlay nav labels: `text-4xl tracking-tight text-foreground`.
Section titles are not large. They are mono labels. See below.

### Section and UI labels

The repeating label recipe:

```
font-mono text-[11px] tracking-[0.16em] text-muted uppercase
```

Tracking varies by role. Stay in this band:
| Role | Size | Tracking |
| --- | --- | --- |
| Section header | 11px | `0.22em` |
| Nav wordmark | `text-xs` | `0.2em` |
| Hero location, About categories | 11px | `0.18em` |
| Nav links, buttons, card kicker | 11px | `0.16em` |
| Contact footer, resume chrome | 11px | `0.14em` |
| Filter chips, pointers | 11px | `0.12em` |
| Tags | 10px | `0.14em` |
| Project stack line | 10px | `tracking-wide` |
Numbered labels always look like `01 / TITLE`:

```tsx
<span className="text-accent">{number}</span>
<span className="mx-2 text-border">/</span>
{title}
```

`SectionHeader` is the shared implementation. Hero index cards and Education's "Certification" kicker follow the same language.

### Body and titles

| Role                   | Classes                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Hero headline          | `text-lg leading-relaxed text-foreground sm:text-xl`, `max-w-2xl`                        |
| About                  | `text-[1.05rem] leading-[1.7] text-foreground sm:text-lg sm:leading-[1.75]`, `max-w-2xl` |
| Card title             | `text-xl text-foreground` (Experience adds `leading-snug`)                               |
| Card / bullet body     | `text-sm leading-relaxed text-foreground/90`                                             |
| Meta (company, school) | `text-sm text-foreground/80`                                                             |
| Dates, locations       | mono 11px, `text-muted`                                                                  |

Do not add `font-semibold` or `font-bold` to card titles. Weight comes from Inter's default and from size.

## Shape and spacing

Radius is always `rounded-[2px]`. Never `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full` (except the unused geometric idea of a circle; the theme toggle is a 2px square).
No box-shadow. No blur. No CSS gradient on UI. The globe layer uses a horizontal mask gradient so it does not sit under the copy. That is the only gradient.

### Page frame

- Shell: `mx-auto max-w-6xl px-5 lg:px-8`
- Sections: `py-24`
- Sticky nav: `h-14`, `border-b border-border bg-background`, `z-50`
- `section[id]` has `scroll-margin-top: 5.5rem`
- Smooth scroll on `html`, disabled when `prefers-reduced-motion: reduce`

### Section grid

From `lg` up, every numbered section is 12 columns, `gap-x-10`, header in 3, content in 9. Stacked on small screens with `gap-8`. Hero is 7 / 5 instead of 3 / 9.

### Cards

Default surface:

```
rounded-[2px] border border-border bg-surface px-5 py-6
transition-colors duration-200 hover:border-accent
```

Projects and Skills use `p-5`. Hero index and Contact rows use `px-5 py-4`. Hover changes the border to accent. No lift, no fill change, no shadow.
Gaps between sibling cards: `gap-4`. Inner wrap gaps for tags/chips: `gap-1.5`. Button clusters: `gap-3`. Nav links: `gap-8`.
Experience bullets use an accent en dash, not a disc:

```
relative pl-4 ... before:absolute before:left-0 before:text-accent before:content-['–']
```

Project stack lines join with a middle dot: `stack.join(" · ")`.

## Buttons and links

Color transitions are `transition-colors duration-200`. That duration is the site-wide hover timing. Do not use 300ms, bounce, or scale.
**Primary (Contact in the hero).** Filled accent, ink is `text-background`. Hover inverts to transparent fill and accent text:

```
rounded-[2px] border border-accent bg-accent px-4 py-2.5
font-mono text-[11px] tracking-[0.16em] text-background uppercase
hover:bg-transparent hover:text-accent
```

**Secondary (View Projects).** Quiet outline:

```
rounded-[2px] border border-border px-4 py-2.5
```
