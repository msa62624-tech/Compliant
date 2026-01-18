# Screenshots Guide - New Features

## 📸 Screenshots Needed for New Features

Since the application requires authentication and a running environment, screenshots should be taken in a development or staging environment. Below are the key screens that demonstrate the new features implemented.

---

## 🎯 Priority Screenshots to Take

### 1. Broker Selection Modal Dialog ⭐ HIGH PRIORITY

**Page:** `/subcontractor/broker`

**What to capture:**
- The full-screen modal dialog that appears when first visiting the broker page
- Shows both "Single Broker" and "Multiple Brokers" cards
- Highlight the visual design with icons, benefits, and tip section

**User Flow:**
1. Log in as subcontractor
2. Navigate to broker information page
3. The modal automatically appears
4. **Screenshot 1:** Full modal view
5. **Screenshot 2:** Hover over "Single Broker" card (shows hover effect)
6. **Screenshot 3:** Hover over "Multiple Brokers" card

**File naming:**
- `broker-selection-modal-initial.png`
- `broker-selection-modal-hover-single.png`
- `broker-selection-modal-hover-multiple.png`

---

### 2. Broker Autocomplete - Global Broker ⭐ HIGH PRIORITY

**Page:** `/subcontractor/broker` (after selecting "Single Broker")

**What to capture:**
- The broker name field with autocomplete
- Type 2-3 characters to trigger search
- Show dropdown with existing brokers

**User Flow:**
1. Select "Single Broker" from modal
2. Start typing in "Broker Name" field (e.g., "John")
3. **Screenshot 1:** Typing with loading indicator
4. **Screenshot 2:** Dropdown showing existing brokers
5. **Screenshot 3:** After selecting a broker (fields autofilled)

**File naming:**
- `broker-autocomplete-typing.png`
- `broker-autocomplete-results.png`
- `broker-autocomplete-selected.png`

---

### 3. Broker Autocomplete - Per-Policy Brokers ⭐ MEDIUM PRIORITY

**Page:** `/subcontractor/broker` (after selecting "Multiple Brokers")

**What to capture:**
- Different autocomplete for each policy type
- Show GL broker autocomplete
- Show that each policy has its own search

**User Flow:**
1. Select "Multiple Brokers" from modal
2. Scroll to GL Broker section
3. **Screenshot 1:** GL broker autocomplete with results
4. **Screenshot 2:** AUTO broker autocomplete with results
5. **Screenshot 3:** Full form showing all policy types

**File naming:**
- `broker-autocomplete-gl-policy.png`
- `broker-autocomplete-auto-policy.png`
- `broker-autocomplete-all-policies.png`

---

### 4. Selected Broker Type Indicator ⭐ MEDIUM PRIORITY

**Page:** `/subcontractor/broker` (after selecting a broker type)

**What to capture:**
- The status badge showing selected broker type
- The "Change Broker Type" button

**User Flow:**
1. After selecting a broker type, form is displayed
2. Top of form shows purple badge with selection
3. **Screenshot:** Badge and change button visible

**File naming:**
- `broker-type-indicator-single.png`
- `broker-type-indicator-multiple.png`

---

### 5. Subcontractor Autocomplete (Existing Feature) 📋 OPTIONAL

**Page:** `/gc/projects/[id]/subcontractors` or similar GC page

**What to capture:**
- Existing subcontractor autocomplete functionality
- Shows it was already working

**User Flow:**
1. Log in as GC
2. Navigate to add subcontractor
3. Type in subcontractor search field
4. **Screenshot:** Dropdown with subcontractor results including trades

**File naming:**
- `subcontractor-autocomplete-existing.png`

---

## 📋 Comparison Screenshots (Before/After)

### Before (Old UI):
**File:** `screenshots/no-auth-subcontractor-broker.png` (existing)
- Simple radio buttons
- No visual hierarchy
- Inline with form

### After (New UI):
**Files to create:**
- `screenshots/broker-selection-modal-initial.png`
- Shows prominent modal
- Visual cards with icons
- Better user guidance

---

## 🎬 Animated GIF/Video Recommendations

For the best demonstration, consider creating:

### 1. Broker Selection Flow (15-20 seconds)
1. Load broker page
2. Modal appears
3. Hover over options
4. Click "Single Broker"
5. Form appears with badge
6. Click "Change Broker Type"
7. Modal appears again

**File naming:** `broker-selection-flow.gif`

### 2. Broker Autocomplete Demo (10-15 seconds)
1. Start typing broker name
2. Loading indicator appears
3. Dropdown shows results
4. Click a broker
5. Fields autofill
6. Can modify fields

**File naming:** `broker-autocomplete-demo.gif`

---

## 🛠️ How to Take Screenshots

### Method 1: Using Browser DevTools
1. Open browser DevTools (F12)
2. Click "Device Toolbar" icon (Ctrl+Shift+M)
3. Set viewport to 1920x1080 or 1440x900
4. Navigate to the page
5. Press Ctrl+Shift+P → "Capture full size screenshot"

### Method 2: Using Browser Extensions
- **Chrome:** Awesome Screenshot, GoFullPage
- **Firefox:** Firefox Screenshot (built-in)

### Method 3: Using Playwright (Recommended for Automation)
```bash
# Run the application
pnpm dev

# In another terminal, run screenshot script
cd tests
npx playwright test --headed --project=chromium screenshots.spec.ts
```

---

## 📊 Screenshot Specifications

### Resolution:
- **Desktop:** 1920x1080 or 1440x900
- **Tablet:** 768x1024 (if testing responsive)
- **Mobile:** 375x667 (if testing responsive)

### Format:
- **Format:** PNG (for quality)
- **Compression:** Optimize with tools like TinyPNG
- **Max file size:** 500KB per image

### Quality:
- Use browser's full-page screenshot feature
- Ensure text is readable
- Show mouse cursor for hover states
- Include browser chrome if showing navigation flow

---

## 📝 Screenshot Checklist

Before considering screenshots complete:

- [ ] Broker selection modal (3 screenshots)
- [ ] Global broker autocomplete (3 screenshots)
- [ ] Per-policy broker autocomplete (3 screenshots)
- [ ] Broker type indicator (2 screenshots)
- [ ] Optional: Subcontractor autocomplete (1 screenshot)
- [ ] Optional: Animated GIFs (2 GIFs)
- [ ] All screenshots named according to convention
- [ ] All screenshots optimized for size
- [ ] All screenshots added to git and committed
- [ ] Updated SCREENSHOTS.md with new images

---

## 🔗 Update Documentation

After taking screenshots, update these files:

### 1. SCREENSHOTS.md
Add new sections for:
- Broker Selection Modal
- Broker Autocomplete Features
- UI Enhancements

### 2. README.md
Add link to screenshots:
```markdown
## 🎨 UI Preview

Check out our enhanced broker selection interface:
- [Broker Selection Modal](./screenshots/broker-selection-modal-initial.png)
- [Broker Autocomplete](./screenshots/broker-autocomplete-results.png)
```

### 3. Pull Request Description
Include screenshots in PR description to show reviewers the improvements

---

## ⚠️ Important Notes

1. **Authentication Required:** Most features require login
2. **Test Data:** Ensure database has test brokers for autocomplete to work
3. **Responsive:** Consider mobile/tablet screenshots too
4. **Dark Mode:** If supported, take dark mode screenshots
5. **Accessibility:** Include alt text descriptions for all images

---

**Status:** ⏳ Waiting for environment with running application to take screenshots

**Next Steps:**
1. Start development server: `pnpm dev`
2. Seed database with test data: `pnpm db:seed`
3. Log in with test credentials
4. Navigate to broker page
5. Take screenshots following this guide
6. Commit screenshots to repository
7. Update documentation

---

**Last Updated:** January 18, 2026
