# AlfaFocus Design System & Brand Identity

![AlfaFocus Logo](assets/alfafocus-logo.svg)

This document establishes the official brand identity, color architecture, typography scale, and UI rules for **AlfaFocus**, ensuring cohesive visual hierarchy and accessibility across every view.

---

## 1. Brand Identity & Logo Specification

### 1.1 Motif & Symbolism
The AlfaFocus emblem unites two core metaphors:
1. **The Greek Alpha ($\alpha$)**: Symbolizes the *Alpha state of consciousness* (relaxed, high-functioning concentration), prime priority, and starting with intention.
2. **The Precision Focal Dot**: A weighted center point nested inside the Alpha loop, representing targeted single-tasking and eliminating cognitive fragmentation.
3. **Continuous Geometry**: A single unbroken stroke with reinforced thickness ($3.4\text{px}$) to guarantee high-definition clarity from tiny $16\text{px}$ favicon scales to $256\text{px}$ hero banners.

```
       [Top Entry]
          \
           \       [Alpha Loop]
            \     .-------.
             \   /    •    \
              \ /   (Focal) \
               X     Dot    |
              / \           /
             /   \_________/
            /
      [Bottom Exit]
```

### 1.2 Lockup & Logotype
* **Mark Container**: Dark Slate Squircle tile (`#18181B` surface with `#27272A` hairline border and `12px` border radius).
* **Wordmark**: Dual-Weight, Dual-Tone styling:
  * **Alfa**: Clean extra-bold sans-serif in stark white (`#FAFAFA`).
  * **Focus**: Bold sans-serif in cyber emerald (`#10B981`).
* **Clearspace Rule**: Maintain a minimum boundary of $1\times$ the focal dot radius on all sides of the mark.

---

## 2. Color Palette & Accessibility

AlfaFocus utilizes a dark-mode first **Cyber Emerald & Deep Zinc** color system. All primary text combinations exceed the **WCAG AAA** contrast standard ($7:1$), and secondary text satisfies **WCAG AA** ($4.5:1$).

| Role | Name | Hex Code | Code Token | Contrast Ratio (vs BG) |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | Deep Onyx | `#09090B` | `alfa.bg` / `bg-[#09090B]` | Base background |
| **Card Surface** | Zinc 900 | `#18181B` | `alfa.surface` / `bg-[#18181B]` | Elevated surface |
| **Primary Brand**| Cyber Emerald | `#10B981` | `alfa.accent` / `emerald-500` | Accent & CTA |
| **Primary Dark** | Deep Emerald | `#059669` | `alfa.primary` / `emerald-600` | Button hover |
| **Highlight** | Neon Mint | `#34D399` | `emerald-400` | Active states |
| **Border / Muted**| Dark Zinc | `#27272A` | `zinc-800` | Structural dividers |
| **Text Primary** | Crisp White | `#FAFAFA` | `alfa.text` / `zinc-50` | $17.5:1$ (AAA) |
| **Text Secondary**| Cool Silver | `#A1A1AA` | `zinc-400` | $7.1:1$ (AAA) |
| **Muted Text** | Slate Dust | `#71717A` | `zinc-500` | $4.8:1$ (AA) |
| **Activity Level**| Streak Green | `#22C55E` | `alfa.heatmap` / `green-500` | Habit heatmap fills |
| **Alert / Danger**| Crimson Rose | `#F43F5E` | `rose-500` | Destructive actions |

---

## 3. Typography Scale

AlfaFocus employs a system sans-serif font stack for maximum rendering performance, instant loading, and zero layout shift:
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Monospace is reserved for the Pomodoro timer countdown, keyboard shortcut hints, and technical identifiers:
```css
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### Type Hierarchy
| Scale Name | Size / Leading | Weight | Application |
| :--- | :--- | :--- | :--- |
| **Timer Display** | `36px` / `1.1` | Bold (`700`), Mono | Focus countdown clock (`25:00`) |
| **Screen Title** | `24px` / `1.25` | Bold (`700`) | Page headers ("Today's Focus", "Projects") |
| **Section Header**| `18px` / `1.3` | Bold (`700`) | Modal titles, category cards |
| **Body Primary** | `14px` / `1.5` | Regular (`400`) / Medium (`500`) | Task titles, calendar event blocks |
| **Caption** | `12px` / `1.4` | Medium (`500`) | Filter chips, dates, helper hints |
| **Micro Badge** | `11px` / `1.2` | Semibold (`600`), Mono | Demo mode indicator, priority pills |

---

## 4. Spacing System

Strict $4\text{px}$ baseline increments:
* **Micro Spacing (`4px` / `gap-1`)**: Icon-to-label separation, badge padding.
* **Component Padding (`8px` / `p-2`)**: List item row padding, compact buttons.
* **Standard Card (`16px` / `p-4`)**: Task cards, modal content chunks, sidebar items.
* **Layout Gutter (`24px` - `32px` / `p-6` - `p-8`)**: Main workspace page margins.

---

## 5. Component States & Interaction

### 5.1 Reusable Component Registry
1. `<AlfaLogo />`: Scalable branding component supporting `variant="full"`, `variant="icon"`, and sizes `sm`, `md`, `lg`.
2. `<AlfaIcon />`: Standalone raw SVG path for custom layouts and favicons.
3. **Buttons**:
   * *Primary*: `bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/50`
   * *Secondary / Neutral*: `bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700`
   * *Ghost*: `text-zinc-400 hover:text-white hover:bg-zinc-800/60`
4. **Keyboard Accessibility**:
   * All interactive elements enforce `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]`.

### 5.2 UI States
* **Loading State**: Pulse animation on muted zinc skeleton placeholders (`animate-pulse bg-zinc-800/50`).
* **Empty State**: Centralized card featuring an emerald icon outline, supportive microcopy, and a prominent "Add Your First Task" CTA.
* **Error State**: Non-blocking toast notification system with subtle crimson styling (`bg-rose-950/90 text-rose-300 border border-rose-800/80`).
* **Active Focus Mode**: Ambient pulsing status ring with animated circular countdown stroke.

---

## 6. Asset Locations in Codebase

* **Logo Component**: `client/src/components/AlfaLogo.jsx`
* **Favicon Vector**: `client/public/favicon.svg`
* **Metadata & Favicon Link**: `client/index.html`
* **Tailwind Theme Extends**: `client/tailwind.config.js`
* **Vector Graphic Master**: `docs/assets/alfafocus-logo.svg`
