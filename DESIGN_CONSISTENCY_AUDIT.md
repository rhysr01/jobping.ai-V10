# Design Consistency Audit

## ❌ Inconsistencies Found

### 1. **HotMatchBadge Component**
- **Current:** Uses brand purple (`from-brand-700/50`, `bg-brand-700`)
- **Should be:** Emerald gradient for high matches (92%+)
- **File:** `components/ui/HotMatchBadge.tsx`

### 2. **BentoGrid/HowItWorks Cards**
- **Current:** Brand purple glow effects (`rgba(139,92,246,0.15)`)
- **Should be:** Emerald accents for consistency
- **File:** `components/BentoGrid.tsx`

### 3. **PremiumEmailShowcase**
- **Current:** 
  - Still uses emoji 🔥 in match badges
  - Purple premium badge
  - Basic card styling (not glassmorphic)
- **Should be:**
  - Custom match badges (no emoji, animated pulse dot)
  - Emerald premium badge
  - Glassmorphic cards with hover effects
- **File:** `components/marketing/PremiumEmailShowcase.tsx`

### 4. **Visa Confidence Badges**
- **Current:** Uses emojis (✅ 🟡 🔵 ❌)
- **Should be:** Custom icon-based badges matching design system
- **Files:** `components/marketing/PremiumEmailShowcase.tsx`, `Utils/matching/visa-confidence.ts`

### 5. **Match Score Badges (Email Showcase)**
- **Current:** Basic styling, emoji included
- **Should be:** Custom gradient badges matching HeroMobileMockup style
- **File:** `components/marketing/PremiumEmailShowcase.tsx`

## ✅ Consistent Elements

- Hero section (gradient orbs, glassmorphic cards)
- Trust badges (hover effects, emerald accents)
- Premium pricing card (emerald glow)
- Footer (gradient fade, emerald accents)
- Job cards in HeroMobileMockup (glassmorphism, custom badges)

## 🎯 Design System Standards

**Colors:**
- **Primary Accent:** Emerald (`emerald-500`, `emerald-600`)
- **Secondary Accent:** Teal (`teal-500`)
- **Brand Purple:** Use sparingly for brand elements only
- **High Matches (92%+):** Emerald gradient
- **Lower Matches:** Purple gradient

**Glassmorphism:**
- `bg-white/[0.03]` with `backdrop-blur-[12px]`
- `border border-white/8`
- Hover: `hover:bg-white/[0.06] hover:border-emerald-500/30`

**Match Badges:**
- Custom gradient (no emojis)
- Animated pulse dot
- Shadow effects

**Hover Effects:**
- Lift: `hover:-translate-y-1`
- Glow: Emerald gradient blur
- Shadow: `shadow-[0_20px_48px_rgba(16,185,129,0.15)]`

