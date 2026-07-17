# Design System Reference

Both prototypes (`candidate-portal.jsx`, `admin-portal.jsx`) already implement this — treat those files as the ground truth for visual details; this doc explains the *why* so the agent doesn't quietly drift from it while refactoring into a real app.

## Color tokens

```js
const C = {
  navy: "#0B3B60",       // primary brand, sidebar active states, primary buttons
  navyDark: "#082A47",   // sidebar background
  navySoft: "#E7EEF4",   // primary-tinted backgrounds (badges, icon chips)
  teal: "#0E7C7B",       // secondary/positive action, links, "in progress"
  tealSoft: "#E4F3F2",
  amber: "#B9791E",      // pending/attention states
  amberSoft: "#FBF0DC",
  green: "#2F8F5B",      // success/completed/passed
  greenSoft: "#E7F5EC",
  red: "#B84332",        // rejected/error/destructive
  redSoft: "#FBEAE7",
  ink: "#14213D",        // primary text
  slate: "#5B6472",      // secondary text
  slateSoft: "#F1F2F0",  // neutral chip background
  surface: "#F6F7F5",    // page background
  card: "#FFFFFF",       // card/panel background
  border: "#E3E5E0",
};
```

Both products use the **identical palette** — this is one brand with two surfaces, not two designed products.

## Typography & iconography

- Icon set: `lucide-react` throughout, `size={13–18}` depending on context, always paired with `aria-hidden="true"` when decorative
- Font sizes are mostly `text-xs` (12px) and `text-[11px]` for dense data, `text-sm`/`text-base` for headings — this is a data-density-first product, not a marketing page

## The recurring "path" motif

A dotted line-and-dots graphic (navy/teal, low opacity) appears on auth screens as a quiet nod to "Tech Path." The journey stepper (filled circles connected by lines, green when complete) is the same visual idea reused functionally on the Dashboard and My Progress. Keep this motif — don't introduce a second, unrelated illustration style.

## Layout shell (identical shape, both products)

```
<aside>  Sidebar — grouped nav sections, uppercase group labels,
         active item gets navy-tinted background + aria-current="page"
<header> Topbar — page title (h1), search input, notification bell
         with real unread count, avatar
<main>   Page content, max-w-5xl, px-5/8 py-6
```

## Component patterns to reuse, not reinvent

- **StatusPill** — colored rounded-full badge driven by a `_META` lookup object (`{label, color, bg}`) keyed by status string. Both `applications` (candidate side, `STATUS_META`) and leads (admin side, `LEAD_STATUS_META`) follow this exact pattern.
- **Company badge** — deterministic colored initials (`companyBadge(name)`), cycling through a fixed 5-color array indexed by `name.length % 5`. Used instead of a generic building icon so a list of companies reads as visually distinct at a glance.
- **Table-not-cards for records with many fields** — Applications and Leads are dense multi-field records; render as a real `<table>`, not expandable cards. Cards are for lower-density content (interviews, trainings, announcements).
- **Saved plain-text field, not chat** — any "notes"/"comment" field (application comments, lead notes) is a `<textarea>` that saves on blur with a brief inline "Saved" confirmation. Reserve message-bubble chat UI *only* for the dedicated Messages page.
- **Tabs for busy detail pages** — Candidate Detail uses a tab bar (Profile / Applications / Documents / Trainings / Messages / Account & Security) instead of one long scrolling page.
- **Empty states** — a small custom SVG illustration (folder + search glyph, brand-colored dots) plus a one-line explanation, used whenever a filtered/derived list can legitimately be empty (no applications match filter, nothing upcoming, no documents yet).

## Accessibility baseline (apply globally, not per-page)

```css
a:focus-visible, button:focus-visible, input:focus-visible,
select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid #0B3B60;
  outline-offset: 2px;
}
```

Inject this once globally (e.g. in a root layout / global stylesheet) rather than per-component. Combine with real landmarks (`<header>`, `<nav aria-label>`, `<main>`, `<aside>`), `aria-current="page"` on active nav items, and `aria-label`s on every icon-only button.
