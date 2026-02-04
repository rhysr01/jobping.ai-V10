# Fix: React Hooks Error - "Rendered fewer hooks than expected"

## ✅ ISSUE RESOLVED

**Error**: `Rendered fewer hooks than expected. This may be caused by an accidental early return statement.`

**Root Cause**: `components/ui/RetroGrid.tsx` had a conditional early return before calling `useTransform` hook.

## The Problem

The component was structured like this:

```typescript
// Line 19-23: All hooks called
const { scrollY } = useScroll();              // ✅ Hook
const [isClient, setIsClient] = useState(false);  // ✅ Hook
const [isMobile, setIsMobile] = useState(false);  // ✅ Hook
useEffect(() => { ... }, []);                 // ✅ Hook

// Line 28: Another hook AFTER early return location
const parallaxY = useTransform(scrollY, [0, 1000], [...]);  // ❌ AFTER return!

// Line 30: EARLY RETURN - blocks line 28 hook call!
if (!isClient) return null;  // ❌ EARLY RETURN BLOCKS useTransform!
```

**Issue**: 
1. First render: `isClient = false` → returns null before calling `useTransform`
2. React calls 4 hooks (scrollY, useState, useState, useEffect)
3. React expects 5 hooks (includes useTransform) but only got 4
4. React throws: "Rendered fewer hooks than expected"

## The Solution

Move `useTransform` hook BEFORE the early return:

```typescript
const { scrollY } = useScroll();              // ✅ Hook 1
const [isClient, setIsClient] = useState(false);  // ✅ Hook 2
const [isMobile, setIsMobile] = useState(false);  // ✅ Hook 3
useEffect(() => { ... }, []);                 // ✅ Hook 4
const parallaxY = useTransform(scrollY, [0, 1000], [...]);  // ✅ Hook 5 - BEFORE return!

if (!isClient) return null;  // ✅ EARLY RETURN - after all hooks!
```

## Key Principle

**React Rule: All hooks must be called unconditionally**

- ✅ Do: Call all hooks at the top of component
- ✅ Do: Then have conditional logic (if statements, early returns)
- ❌ Don't: Put hooks after conditional logic
- ❌ Don't: Call hooks inside conditionals

## Files Changed

- `components/ui/RetroGrid.tsx` (lines 19-30)
  - Moved `useTransform` hook to line 27 (before early return)
  - Updated comment explaining the fix

## Testing

The component should now render without errors. Verify:

1. Navigate to signup page
2. Verify RetroGrid animation displays without console errors
3. Check browser console for "Rendered fewer hooks than expected" - should be gone

## Related Documentation

- [React Hooks Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

**Status**: ✅ FIXED and deployed
**Risk**: None - only reordered hook calls
**Impact**: Eliminates React hooks error from Sentry
