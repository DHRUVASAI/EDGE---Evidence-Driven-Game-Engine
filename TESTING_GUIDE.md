# 🧪 CricMetrics Testing Guide
**Updated:** July 6, 2026  
**Dev Server:** http://localhost:3000

---

## ✅ Pre-Testing Checklist

- [x] TypeScript compiles without errors
- [x] Dev server is running (`npm run dev`)
- [x] All new API routes created
- [x] Environment variables configured (`.env`)

---

## 🎯 Test Scenarios

### 1. Player Images Integration

#### Test Case 1.1: Homepage Player Images
**Location:** Dashboard → IPL Console / Fantasy Command Center  
**Expected:** Player avatars should load with actual photos (not just SVG fallbacks)

**Steps:**
1. Open http://localhost:3000
2. Scroll to "IPL Console" section
3. Click any team (e.g., "CSK", "MI", "RCB")
4. **Check:** Top Batter and Top Bowler images load
5. **Expected:** Real player photos or clean SVG avatars (no broken images)

**Success Criteria:**
- ✅ Images load within 2-3 seconds
- ✅ No 404 errors in browser console
- ✅ SVG fallback shows player initials if photo unavailable

---

#### Test Case 1.2: ICC Rankings Player Images  
**Location:** Dashboard → ICC Rankings section  
**Expected:** All 5 players in each category should show avatars

**Steps:**
1. Scroll to "Official ICC Player Rankings"
2. Check Top Batsmen, Top Bowlers, Top All-Rounders columns
3. **Check:** Small circular avatars next to each player name
4. Switch formats: T20 → ODI → Test
5. **Expected:** Images update for new players

**Success Criteria:**
- ✅ 15 total player images visible (5 per column)
- ✅ Images are circular, properly cropped
- ✅ Format switching updates images correctly
- ✅ "Live ICC feed" badge shows with green pulsing dot

---

#### Test Case 1.3: Player Form Dashboard  
**Location:** Dashboard → Player Form & Selection Advisor  
**Expected:** Player picker dropdown shows avatars inline

**Steps:**
1. Scroll to "Player Form & Selection Advisor"
2. Click the player dropdown (default shows first player)
3. **Check:** Dropdown opens with search box
4. Type "Virat" in search
5. **Expected:** Virat Kohli appears with small avatar on left
6. Select a player
7. **Check:** Main player stats cards update with new player

**Success Criteria:**
- ✅ Player dropdown shows avatars (7x7 circular images)
- ✅ Search filters players in real-time
- ✅ Selected player image shows in dropdown trigger
- ✅ XI Recommendations section shows 11 player cards with large avatars

---

### 2. Live ICC Rankings API

#### Test Case 2.1: API Endpoint Direct Test
**Endpoint:** http://localhost:3000/api/icc-rankings?format=T20

**Steps:**
1. Open URL in browser or use Postman/Insomnia
2. **Check JSON response structure:**
```json
{
  "batting": [...],
  "bowling": [...],
  "allRounder": [...],
  "source": "icc-live" or "fallback",
  "updatedAt": "2026-07-06T..."
}
```
3. Try other formats: `?format=ODI` and `?format=Test`

**Success Criteria:**
- ✅ Returns 200 OK
- ✅ Each category has exactly 5 players
- ✅ `source` field indicates "icc-live" (if RapidAPI works) or "fallback"
- ✅ Player names, countries, ratings are populated
- ✅ Response time < 2 seconds

---

#### Test Case 2.2: Rankings Component Integration
**Location:** Dashboard → ICC Rankings

**Steps:**
1. Open browser DevTools (F12) → Network tab
2. Refresh dashboard
3. Filter by "icc-rankings" in Network tab
4. **Check:** Request to `/api/icc-rankings?format=T20`
5. Click "ODI" button
6. **Check:** New request to `/api/icc-rankings?format=ODI`

**Success Criteria:**
- ✅ Only 1 API call per format switch
- ✅ SWR caching prevents duplicate requests
- ✅ Badge shows "Live ICC feed" with pulsing dot (if API succeeds)
- ✅ Timestamp updates correctly: "Updated Jul 6, 2:45 PM"

---

#### Test Case 2.3: Fallback Handling
**Simulate API Failure:**

**Option A - Network Throttling:**
1. DevTools → Network tab → Set throttling to "Offline"
2. Refresh page
3. **Expected:** Rankings still appear with "Fallback rankings" badge

**Option B - Invalid API Key:**
1. Temporarily change `.env`: `RAPIDAPI_KEY="invalid"`
2. Restart dev server: `npm run dev`
3. Refresh dashboard
4. **Expected:** Component shows fallback data, no errors in UI

**Success Criteria:**
- ✅ No visible errors or crashes
- ✅ Badge changes to "Fallback rankings"
- ✅ Player data still renders (from hardcoded fallback)
- ✅ Console logs warning: "Using fallback rankings for T20"

---

### 3. Frontend Polish & Animations

#### Test Case 3.1: Dashboard Spacing
**Location:** Full dashboard homepage

**Steps:**
1. Scroll through entire dashboard slowly
2. **Check:** Large gaps between major sections:
   - DashboardHeader → LiveMatches
   - ICCRankings → IPLConsole
   - PlayerFormDashboard → QuickActions
3. **Expected:** Sections feel separated, not cramped

**Success Criteria:**
- ✅ Major sections have ~4rem (64px) vertical spacing
- ✅ Components within sections have ~2.5rem (40px) spacing
- ✅ Page feels organized, not cluttered

---

#### Test Case 3.2: Hover Effects
**Location:** DashboardHeader KPI cards

**Steps:**
1. Hover over "Matches Analyzed" card
2. **Check animations:**
   - Card scales up slightly (2%)
   - Border color shifts to lime green
   - Background glow becomes more visible
   - Icons change color
3. Repeat for all 3 cards

**Success Criteria:**
- ✅ Smooth 300ms transition
- ✅ Card lifts with shadow effect
- ✅ Lime glow appears on hover
- ✅ No janky/stuttering animations

---

#### Test Case 3.3: Scrollbar Styling
**Location:** Any page with vertical scroll

**Steps:**
1. Scroll dashboard up/down
2. **Check scrollbar appearance:**
   - Width: 8px (slim)
   - Track color: Dark background (#0a0a0f)
   - Thumb color: #27272a (dark gray)
3. Hover over scrollbar thumb
4. **Expected:** Thumb changes to lighter gray (#3f3f46)

**Success Criteria:**
- ✅ Scrollbar matches dark theme
- ✅ Not intrusive (slim profile)
- ✅ Hover feedback visible

---

#### Test Case 3.4: Player Picker Interaction
**Location:** Player Form Dashboard

**Steps:**
1. Click player dropdown
2. **Check:**
   - Dropdown opens with smooth animation
   - Search input auto-focuses
   - Shows top 40 players by default
3. Type "Bum" in search
4. **Expected:** Filters to Jasprit Bumrah instantly
5. Clear search with X button
6. **Expected:** Returns to top 40 players
7. Click outside dropdown
8. **Expected:** Dropdown closes

**Success Criteria:**
- ✅ Search is instant (no lag)
- ✅ Images in dropdown load quickly
- ✅ Keyboard navigation works (Tab, Enter)
- ✅ Click outside closes dropdown

---

#### Test Case 3.5: XI Recommendations Card Design
**Location:** Player Form Dashboard → AI XI Recommendations

**Steps:**
1. Scroll to "Form-Based XI Advisor"
2. **Check player cards:**
   - Large avatar at top (64x64)
   - Player name wraps cleanly (no overflow)
   - Role badge with icon (BAT/BOWL/AR/WK)
   - Form score progress bar
   - Stats grid (Runs/Wickets/Matches)
3. Hover over cards
4. **Expected:** Card scales up slightly, shadow appears

**Success Criteria:**
- ✅ All 11 player cards render in grid
- ✅ Captain card has yellow ribbon at top
- ✅ Vice-Captain has purple ribbon
- ✅ No text overflow or truncation issues
- ✅ Form score bar animates on load

---

### 4. Mobile Responsiveness

#### Test Case 4.1: Mobile Layout (375px)
**Device Simulation:** iPhone SE / iPhone 12 Mini

**Steps:**
1. DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select "iPhone SE" (375x667)
3. Scroll through dashboard
4. **Check:**
   - KPI cards stack vertically (1 column)
   - ICC Rankings columns stack (1 column)
   - Player picker dropdown doesn't overflow screen
   - XI cards show 2 columns (not 6)

**Success Criteria:**
- ✅ No horizontal scroll
- ✅ All text is readable
- ✅ Touch targets are 44x44px minimum
- ✅ Images scale proportionally

---

#### Test Case 4.2: Tablet Layout (768px)
**Device Simulation:** iPad / iPad Mini

**Steps:**
1. Select "iPad Mini" (768x1024)
2. Check dashboard layout
3. **Expected:**
   - KPI cards: 3 columns
   - ICC Rankings: 3 columns
   - XI cards: 4-5 columns

**Success Criteria:**
- ✅ Layout adapts to tablet width
- ✅ No awkward single-column layouts
- ✅ Spacing feels balanced

---

### 5. Performance Testing

#### Test Case 5.1: Lighthouse Score
**Tool:** Chrome DevTools → Lighthouse

**Steps:**
1. Open http://localhost:3000
2. DevTools → Lighthouse tab
3. Select "Desktop" mode
4. Run analysis
5. **Check scores:**
   - Performance: Target 85+
   - Accessibility: Target 90+
   - Best Practices: Target 90+
   - SEO: Target 80+

**Success Criteria:**
- ✅ Performance score not degraded by new changes
- ✅ No critical accessibility issues
- ✅ Images have proper alt text

---

#### Test Case 5.2: Network Waterfall
**Tool:** DevTools Network tab

**Steps:**
1. Hard refresh (Ctrl+Shift+R)
2. Check Network tab waterfall
3. **Look for:**
   - `/api/player-image` requests (should be many)
   - `/api/icc-rankings` requests (1 per format)
   - Total page load time
4. **Expected:** Page interactive within 3 seconds

**Success Criteria:**
- ✅ Player images load in parallel (not sequentially)
- ✅ API routes return within 500ms
- ✅ No excessive API calls (check for infinite loops)

---

### 6. Error Handling

#### Test Case 6.1: Offline Mode
**Steps:**
1. DevTools → Network → Offline
2. Refresh page
3. **Expected:**
   - Dashboard still renders
   - Fallback data shows for rankings
   - SVG avatars appear for players
   - Error boundaries catch failures gracefully

**Success Criteria:**
- ✅ No white screen of death
- ✅ User sees meaningful fallback content
- ✅ Console shows warnings, not crashes

---

#### Test Case 6.2: Invalid Player Name
**Steps:**
1. Manually navigate to: http://localhost:3000/api/player-image?name=ZZZZZ_INVALID
2. **Expected:** SVG avatar with initials "ZZ"

**Success Criteria:**
- ✅ Returns SVG fallback (not 404)
- ✅ SVG has player initials
- ✅ SVG has gradient background

---

#### Test Case 6.3: RapidAPI Quota Exceeded
**Simulate:** Comment out `RAPIDAPI_KEY` in `.env`

**Steps:**
1. `.env` → Comment: `# RAPIDAPI_KEY="..."`
2. Restart server: `npm run dev`
3. Refresh dashboard
4. **Check:**
   - Player images fall back to Wikipedia or SVG
   - ICC Rankings use fallback data
   - Console warns about missing API key

**Success Criteria:**
- ✅ App still works (degraded mode)
- ✅ No errors shown to user
- ✅ Console logs helpful messages

---

## 🐛 Known Issues to Document

If you find issues during testing, document them here:

| # | Issue | Severity | Repro Steps | Status |
|---|-------|----------|-------------|--------|
| 1 | Example: Player X image not loading | Low | Open dashboard, check IPL Console | Open |

---

## ✅ Sign-Off Checklist

Before marking as complete, verify:

- [ ] All player images load or show SVG fallbacks
- [ ] ICC Rankings API returns live data (or falls back gracefully)
- [ ] No TypeScript errors in console
- [ ] Mobile layout works on 375px width
- [ ] Hover animations are smooth (60fps)
- [ ] No accessibility warnings in Lighthouse
- [ ] Page loads in < 3 seconds on fast connection
- [ ] All sections have proper spacing
- [ ] Color contrast meets WCAG AA standards

---

## 📸 Visual Regression Testing

Take screenshots of:
1. Full dashboard homepage (desktop)
2. ICC Rankings section (before/after format switch)
3. Player Form Dashboard with player picker open
4. XI Recommendations cards (hover state)
5. Mobile layout (375px)

Compare with previous version to ensure no unintended changes.

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured on hosting platform
- [ ] `RAPIDAPI_KEY` secret stored securely
- [ ] Database connection string uses production DB
- [ ] CORS headers allow production domain
- [ ] Rate limiting enabled on API routes (prevent abuse)
- [ ] Image CDN configured (optional, for performance)
- [ ] Error monitoring enabled (Sentry/LogRocket)
- [ ] Backup plan if RapidAPI goes down

---

**Last Updated:** July 6, 2026  
**Tested By:** _[Your Name]_  
**Build Version:** Next.js 16.2.9 (Turbopack)  
**Status:** ⏳ Awaiting Manual Testing
