---
trigger: always_on
---

# UI Design Rules — Netsanet
# This file sets the color palette, typography, and emotional tone.
# The agent should design freely within these constraints.
# Do NOT copy generic SaaS templates. Do NOT reproduce the Figma wireframes exactly.
# Think like a designer, not a code generator.

---

## EMOTIONAL BRIEF

Two distinct portals. Two distinct personalities. Both must feel intentional and human.

**Survivor Portal** — A woman in a difficult moment opens this on her phone.
She needs to feel safe, not watched. Calm, not clinical. Heard, not processed.
The UI should feel like a quiet, private room — not a government form, not a helpdesk ticket system.

**Staff Dashboard** — A social worker or lawyer opens this at their desk.
They manage many cases. They need clarity, speed, and trust in the data.
The UI should feel like a well-designed tool — serious but not cold, dense but not cluttered.

---

## COLOR PALETTE

These are the only colors to use. Do not introduce others.

```css
:root {
  /* Brand — teal is the soul of this product */
  --teal-50:  #E8F5F3;
  --teal-100: #B2DDD8;
  --teal-500: #1A7A6E;
  --teal-700: #145F56;
  --teal-900: #0D3D38;

  /* Neutrals */
  --dark:     #1A2332;
  --gray-700: #374151;
  --gray-500: #6B7280;
  --gray-200: #E5E7EB;
  --gray-100: #F3F4F6;
  --surface:  #F8FAFB;
  --white:    #FFFFFF;

  /* Urgency — must be immediately readable at a glance */
  --critical: #DC2626;
  --high:     #EA580C;
  --medium:   #D97706;
  --low:      #6B7280;

  /* Functional */
  --exit-red: #EF4444;
}
```

---

## TYPOGRAPHY

```
Display / Headings : DM Serif Display  (Google Fonts)
Body / UI / Labels : DM Sans           (Google Fonts)
Case numbers / IDs : JetBrains Mono   (Google Fonts)
```

```html
<!-- Add to index.html -->
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```js
// tailwind.config.ts
fontFamily: {
  serif: ['DM Serif Display', 'serif'],
  sans:  ['DM Sans', 'sans-serif'],
  mono:  ['JetBrains Mono', 'monospace'],
}
```

---

## TAILWIND COLOR EXTENSION

```js
// tailwind.config.ts
colors: {
  teal: {
    50:  '#E8F5F3',
    100: '#B2DDD8',
    500: '#1A7A6E',
    700: '#145F56',
    900: '#0D3D38',
  },
  dark: '#1A2332',
  surface: '#F8FAFB',
}
```

---

## DESIGN CONSTRAINTS

These are rules the agent must always follow, regardless of design choices made:

- **Fonts**: Only DM Serif Display, DM Sans, and JetBrains Mono. Never Inter, Roboto, Arial, or system-ui.
- **Colors**: Only the palette above. No purple, violet, indigo, or blue as primary colors.
- **Gradients**: None on backgrounds or hero sections. Flat color only.
- **Border radius**: Vary it intentionally. Not everything should be `rounded-full` or `rounded-2xl`. Mix `rounded-lg` for inputs, `rounded-xl` for cards, `rounded-full` only for pills and avatars.
- **Shadows**: Keep them subtle. `shadow-sm` for cards, `shadow-md` for modals. No dramatic drop shadows.
- **Motion**: Minimal and purposeful. One good transition is better than many scattered animations. `transition-colors duration-150` on interactive elements is enough in most cases.

---

## NON-NEGOTIABLE COMPONENTS

These two components must exist exactly as described. Everything else the agent designs freely.

### QuickExitButton
Appears on EVERY survivor-facing page. Fixed position, always visible, never hidden by other elements.

```jsx
<button
  onClick={() => {
    sessionStorage.clear();
    window.location.replace('https://google.com');
  }}
  className="fixed top-4 right-4 z-50 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors shadow-md"
>
  Quick Exit
</button>
```

### UrgencyBadge
Urgency must be visually unmistakable at a glance. These styles are fixed.

```jsx
const urgencyStyles = {
  critical: 'bg-red-600 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-amber-400 text-gray-900',
  low:      'bg-gray-200 text-gray-700',
};
```

---

## WHAT NOT TO DO

- Do not make the survivor portal look like a ticketing or helpdesk system
- Do not make the dashboard look like a generic SaaS admin template (Tailwind UI, shadcn defaults, etc.)
- Do not use placeholder lorem ipsum content — use realistic Netsanet-appropriate copy
- Do not center-align everything — use left-aligned layouts as the default
- Do not show a survivor's real name or phone number when `is_anonymous = true`
- Do not add blockchain, NFT, or Web3 UI elements — they are out of scope
- Do not generate stock-photo placeholder images or avatar illustrations that look AI-generated