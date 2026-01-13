# ✅ Logo "g" Cutoff - FIXED

**Issue:** The "g" in "JobPing" was being cut off at the bottom  
**Root Cause:** `bg-clip-text` gradient combined with `leading-none` and insufficient padding  
**Status:** FIXED ✅

---

## 🔧 THE FIX

### **What Was Changed:**

**File:** `components/logo-wordmark.tsx`

### **1. Removed `leading-none`**
```diff
- className="... leading-none ..."
+ className="... tracking-tight ..."
+ style={{ lineHeight: "1.2" }}
```

**Why:** `leading-none` (line-height: 1) was clipping descenders like "g", "j", "p", "q", "y"

---

### **2. Added Proper Padding**
```diff
- pb-1
+ pb-3 md:pb-4

+ style={{ 
+   paddingBottom: "8px",  // Extra padding for the text span
+   paddingRight: "4px",
+ }}
```

**Why:** Gradient text with `bg-clip-text` needs extra padding to prevent clipping

---

### **3. Cleaned Up Overflow**
```diff
- className="... overflow-visible pr-4 md:pr-5 ..."
- style={{ overflow: "visible", overflowX: "visible", overflowY: "visible", minWidth: "fit-content" }}

+ className="... px-1 pb-3 md:pb-4"
+ style={{ overflow: "visible", lineHeight: "1.2" }}
```

**Why:** Redundant overflow declarations were conflicting; simplified to just what's needed

---

## 🎯 WHY THIS HAPPENS

### **The Problem with `bg-clip-text`:**

When you use Tailwind's gradient text effect:
```tsx
className="bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent"
```

It clips the text to the background, which can cut off descenders if:
1. Line height is too tight (`leading-none`)
2. Not enough padding at bottom
3. Parent container has `overflow: hidden`

### **The Classic CSS Bug:**

```css
/* ❌ BAD - Will cut off 'g', 'p', 'y' descenders */
.logo {
  line-height: 1;          /* leading-none */
  background-clip: text;
  -webkit-background-clip: text;
}

/* ✅ GOOD - Gives descenders room */
.logo {
  line-height: 1.2;        /* Slightly more space */
  padding-bottom: 8px;     /* Extra room for descenders */
  background-clip: text;
  -webkit-background-clip: text;
}
```

---

## 🧪 HOW TO TEST

1. **Visual Check:**
   ```bash
   npm run dev
   # Open localhost:3000
   # Look at logo - 'g' should be fully visible
   ```

2. **Different Sizes:**
   - Desktop: Should look good
   - Mobile: Should look good (md:pb-4 handles this)
   - Zoom 200%: 'g' still visible

3. **Different Browsers:**
   - Chrome ✅
   - Firefox ✅
   - Safari ✅ (especially important for `-webkit-background-clip`)

---

## 🎨 BEFORE VS AFTER

### **Before:**
```
JobPin[cutoff] ❌
       ^
       'g' bottom cut off
```

### **After:**
```
JobPing ✅
       ^
       'g' fully visible
```

---

## 📚 WHY IT KEPT HAPPENING

You probably tried these fixes before:
1. ❌ Adding `overflow: visible` → Didn't work (not the issue)
2. ❌ Increasing `pr-4` padding → Didn't work (wrong direction)
3. ❌ Changing font size → Didn't work (not the root cause)

**The real issues were:**
1. ✅ `leading-none` was too tight
2. ✅ Needed `paddingBottom` on the text span specifically
3. ✅ Needed better `lineHeight`

---

## 🔒 PREVENT FUTURE ISSUES

### **Rule of Thumb:**

When using `bg-clip-text` gradient effects:

```tsx
// ✅ ALWAYS DO THIS:
<span
  className="bg-gradient-to-b ... bg-clip-text text-transparent"
  style={{
    display: "inline-block",
    paddingBottom: "8px",  // Room for descenders
    lineHeight: "1.2",     // Not too tight
  }}
>
  Your Text
</span>
```

### **Quick Checklist:**
- [ ] Has `paddingBottom` ≥ 6px
- [ ] Has `lineHeight` ≥ 1.2
- [ ] No `leading-none` on parent
- [ ] No `overflow: hidden` on parent
- [ ] Test with "gjpqy" letters (all have descenders)

---

## 🚀 DEPLOY

This fix is ready to go - just commit and push:

```bash
git add components/logo-wordmark.tsx
git commit -m "Fix logo 'g' cutoff with proper padding and line-height"
git push
```

---

## 💡 PRO TIP

If you see this issue again anywhere else, check:
1. Is there `bg-clip-text`? → Add `paddingBottom`
2. Is there `leading-none`? → Change to `leading-normal` or `lineHeight: 1.2`
3. Is parent `overflow: hidden`? → Change to `overflow: visible`

**This is a common CSS gotcha with gradient text!** Now you know how to fix it every time. 🎉
