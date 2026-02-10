# Sortonym Challenge - Brand Color Style Guide

## 🎨 Color Palette

### Primary Colors (Use Most Frequently)

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Primary Green** | `#00A63F` | RGB(0, 166, 63) | Primary CTAs, active states, progress bars, success messages |
| **Black** | `#000000` | RGB(0, 0, 0) | Headings, strong emphasis, primary text |
| **White** | `#FFFFFF` | RGB(255, 255, 255) | Backgrounds, content space, text on dark backgrounds |

### Secondary Colors (Accents & Hierarchy)

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Deep Forest Green** | `#0E5F3A` | RGB(14, 95, 58) | Dark accents, hover states, secondary CTAs |
| **Teal Accent** | `#009688` | RGB(0, 150, 136) | Interactive highlights, info states |
| **Soft Mint** | `#E6F4EE` | RGB(230, 244, 238) | Card backgrounds, hover states, light accents |
| **Cloud Gray** | `#F6F6F6` | RGB(246, 246, 246) | Section backgrounds, dividers |
| **Slate Gray** | `#9CA3AF` | RGB(156, 163, 175) | Secondary text, muted labels |
| **Cool Gray** | `#53565A` | RGB(83, 86, 90) | Icons, subtle text, borders |

---

## 📝 CSS Variables Reference

### Using in Your Code

```css
/* Primary Colors */
var(--brand-green)      /* #00A63F */
var(--brand-black)      /* #000000 */
var(--brand-white)      /* #FFFFFF */

/* Secondary Colors */
var(--deep-forest)      /* #0E5F3A */
var(--teal-accent)      /* #009688 */
var(--soft-mint)        /* #E6F4EE */
var(--cloud-gray)       /* #F6F6F6 */
var(--slate-gray)       /* #9CA3AF */
var(--cool-gray)        /* #53565A */

/* Text Colors */
var(--text-primary)     /* Black for headings */
var(--text-secondary)   /* Cool Gray for body text */
var(--text-muted)       /* Slate Gray for labels */
var(--text-on-green)    /* White for text on green backgrounds */

/* Background Colors */
var(--bg-primary)       /* White */
var(--bg-secondary)     /* Cloud Gray */
var(--bg-card)          /* White */
var(--bg-hover)         /* Soft Mint */
var(--bg-active)        /* Primary Green */

/* Button Colors */
var(--btn-primary-bg)   /* Primary Green */
var(--btn-primary-hover) /* Deep Forest */
```

---

## 🎯 Color Usage Rules

### 1. **Primary Green (#00A63F)**
✅ **Use for:**
- Primary call-to-action buttons
- Active/selected states
- Progress bars and indicators
- Success messages
- Links and interactive elements
- Brand highlights

❌ **Avoid:**
- Large background areas (use sparingly)
- Body text (low contrast with white)

**Example:**
```css
.btn-primary {
    background-color: var(--brand-green);
    color: var(--brand-white);
}

.progress-bar {
    background-color: var(--brand-green);
}
```

### 2. **Black (#000000)**
✅ **Use for:**
- Main headings (H1, H2, H3)
- Strong emphasis text
- Icons that need high contrast
- Navigation text

❌ **Avoid:**
- Large blocks of body text (use Cool Gray instead)
- Backgrounds (use white or Cloud Gray)

**Example:**
```css
h1, h2, h3 {
    color: var(--brand-black);
    font-weight: 700;
}
```

### 3. **White (#FFFFFF)**
✅ **Use for:**
- Main page backgrounds
- Card backgrounds
- Text on dark/green backgrounds
- Content areas

**Example:**
```css
.page-container {
    background-color: var(--brand-white);
}

.btn-primary {
    color: var(--brand-white);
}
```

### 4. **Soft Mint (#E6F4EE)**
✅ **Use for:**
- Card backgrounds
- Hover states
- Subtle highlights
- Section dividers
- Light accents

**Example:**
```css
.card {
    background-color: var(--soft-mint);
}

.btn:hover {
    background-color: var(--soft-mint);
}
```

### 5. **Cloud Gray (#F6F6F6)**
✅ **Use for:**
- Alternate section backgrounds
- Table row backgrounds
- Disabled states
- Subtle dividers

**Example:**
```css
.section-alternate {
    background-color: var(--cloud-gray);
}

.table-row:nth-child(even) {
    background-color: var(--cloud-gray);
}
```

### 6. **Slate Gray (#9CA3AF) & Cool Gray (#53565A)**
✅ **Use for:**
- Secondary text
- Placeholder text
- Icons
- Muted labels
- Timestamps

**Example:**
```css
p {
    color: var(--cool-gray);
}

.label-secondary {
    color: var(--slate-gray);
}

input::placeholder {
    color: var(--slate-gray);
}
```

### 7. **Teal Accent (#009688)**
✅ **Use sparingly for:**
- Interactive highlights
- Info badges
- Special callouts
- Accent borders

**Example:**
```css
.badge-info {
    background-color: var(--teal-accent);
    color: var(--brand-white);
}

.highlight-border {
    border-left: 4px solid var(--teal-accent);
}
```

---

## 🖼️ Component Examples

### Buttons

```css
/* Primary Button */
.btn-primary {
    background-color: var(--brand-green);
    color: var(--brand-white);
    border: 2px solid var(--brand-green);
    box-shadow: 0 4px 12px rgba(0, 166, 63, 0.25);
}

.btn-primary:hover {
    background-color: var(--deep-forest);
    border-color: var(--deep-forest);
}

/* Secondary Button */
.btn-secondary {
    background-color: var(--brand-white);
    color: var(--brand-green);
    border: 2px solid var(--brand-green);
}

.btn-secondary:hover {
    background-color: var(--soft-mint);
}

/* Outline Button */
.btn-outline {
    background-color: transparent;
    color: var(--brand-green);
    border: 2px solid var(--brand-green);
}

.btn-outline:hover {
    background-color: var(--soft-mint);
}
```

### Cards

```css
.card {
    background-color: var(--brand-white);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.card:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Highlighted Card */
.card-highlighted {
    background-color: var(--soft-mint);
    border-color: var(--brand-green);
}
```

### Forms

```css
input, textarea, select {
    background-color: var(--brand-white);
    border: 2px solid var(--border-light);
    color: var(--text-primary);
}

input:focus {
    border-color: var(--brand-green);
    box-shadow: 0 0 0 3px rgba(0, 166, 63, 0.1);
}

input::placeholder {
    color: var(--slate-gray);
}
```

### Tables

```css
.table {
    background-color: var(--brand-white);
}

.table-header {
    background-color: var(--cloud-gray);
    color: var(--brand-black);
    font-weight: 700;
}

.table-row:nth-child(even) {
    background-color: var(--cloud-gray);
}

.table-row:hover {
    background-color: var(--soft-mint);
}
```

### Leaderboard

```css
.leaderboard-item {
    background-color: var(--brand-white);
    border-left: 4px solid var(--brand-green);
}

.leaderboard-rank-1 {
    background-color: var(--soft-mint);
    border-left-color: var(--brand-green);
    border-left-width: 6px;
}

.leaderboard-current-user {
    background-color: var(--soft-mint);
    border: 2px solid var(--brand-green);
}
```

---

## ♿ Accessibility Guidelines

### Contrast Ratios (WCAG AA Compliance)

✅ **Passing Combinations:**
- Black text on White background: **21:1** (AAA)
- Cool Gray text on White background: **7.2:1** (AA)
- White text on Primary Green background: **3.4:1** (AA Large Text)
- White text on Deep Forest background: **7.8:1** (AAA)

⚠️ **Use with Caution:**
- Slate Gray on White: **3.2:1** (AA Large Text only)
- Primary Green on White: Use for accents, not body text

### Recommendations:
1. **Headings**: Use Black (#000000)
2. **Body Text**: Use Cool Gray (#53565A)
3. **Labels/Muted**: Use Slate Gray (#9CA3AF)
4. **Buttons**: White text on Green background (ensure 16px+ font size)

---

## 🎨 Design Principles

### 1. **Clean & Minimal**
- Use plenty of white space
- Avoid clutter
- Let content breathe

### 2. **High Contrast**
- Ensure text is readable
- Use Black for headings
- Use Cool Gray for body text

### 3. **Professional Tech Feel**
- Modern, sharp edges
- Consistent border radius (8px-16px)
- Subtle shadows

### 4. **Green as Accent**
- Don't overuse Primary Green
- Use for CTAs and highlights
- Balance with neutrals (White, Grays)

### 5. **Hierarchy**
- Primary Green for primary actions
- Deep Forest for secondary actions
- Grays for tertiary elements

---

## 📦 Quick Reference

### Color Hierarchy (Most to Least Used)
1. **White** - Primary background
2. **Cloud Gray** - Secondary background
3. **Black** - Headings
4. **Cool Gray** - Body text
5. **Primary Green** - CTAs & highlights
6. **Soft Mint** - Hover states & cards
7. **Slate Gray** - Labels & muted text
8. **Deep Forest** - Hover states
9. **Teal Accent** - Sparingly for highlights

### Do's and Don'ts

✅ **Do:**
- Use Green for primary CTAs
- Use Black for headings
- Use White for backgrounds
- Use Soft Mint for hover states
- Ensure high contrast for text

❌ **Don't:**
- Use Green for large backgrounds
- Use Slate Gray for body text (too light)
- Mix too many colors in one component
- Forget hover/active states
- Ignore accessibility guidelines

---

## 🚀 Implementation Checklist

- [ ] Import `variables.css` in your main CSS file
- [ ] Use CSS variables instead of hardcoded hex values
- [ ] Apply brand colors to buttons
- [ ] Style cards with Soft Mint or White backgrounds
- [ ] Ensure form inputs have Green focus states
- [ ] Add hover states to interactive elements
- [ ] Test contrast ratios for accessibility
- [ ] Use consistent border radius (8px-16px)
- [ ] Apply shadows for depth
- [ ] Test in both light and dark modes

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Maintained by:** Sortonym Challenge Team
