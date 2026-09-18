# 🚀 Quick Reference Guide
**CricMetrics Development - Updated July 6, 2026**

---

## 📋 Essential Commands

### Development Server
```bash
# Start dev server
npm run dev

# Dev server will run at:
http://localhost:3000
```

### TypeScript Compilation
```bash
# Check for TypeScript errors (no emit)
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Database Operations
```bash
# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (DB GUI)
npx prisma studio
```

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Export static site (if configured)
npm run export
```

---

## 🌐 API Endpoints Reference

### Player Images
```
GET /api/player-image?name={playerName}
GET /api/player-image?espnId={espnId}
GET /api/player-image?imageUrl={directUrl}

Example:
http://localhost:3000/api/player-image?name=Virat%20Kohli
```

**Fallback Chain:**
1. Direct DB imageUrl
2. ESPN numeric ID → CDN
3. ESPN Cricinfo via RapidAPI search  ← **NEW**
4. Wikipedia REST API
5. SVG avatar (always works)

---

### ICC Rankings (NEW)
```
GET /api/icc-rankings?format={T20|ODI|Test}

Example:
http://localhost:3000/api/icc-rankings?format=T20
```

**Response Structure:**
```json
{
  "batting": [
    { "rank": 1, "name": "Player Name", "country": "IND", "rating": 861 }
  ],
  "bowling": [...],
  "allRounder": [...],
  "source": "icc-live" | "fallback",
  "updatedAt": "2026-07-06T10:30:00Z"
}
```

---

### Team Logos
```
GET /api/dashboard/team-logo?id={teamId}

Example:
http://localhost:3000/api/dashboard/team-logo?id=CSK
```

---

### Dashboard Summary
```
GET /api/dashboard/summary

Returns:
- Total deliveries count
- Total players count  
- Matches per format
- Top performers (runs, wickets, sixes)
```

---

### IPL Team Stats
```
GET /api/dashboard/ipl-team?teamKey={CSK|MI|RCB|etc}

Returns:
- Team performance metrics
- Top batter with image
- Top bowler with image
- Win rate, venue stats
```

---

## 🔑 Environment Variables

**Location:** `.env` file in project root

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/cricmetrics"
DIRECT_URL="postgresql://user:pass@host:5432/cricmetrics"

# APIs
RAPIDAPI_KEY="your_rapidapi_key_here"
CRICAPI_KEY="your_cricapi_key_here"

# Google Cloud
GOOGLE_API_KEY="your_google_api_key_here"
GCP_PROJECT_ID="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\gcp-service-account.json"
BQ_DATASET="your_dataset_name"

# Other AI APIs
GROQ_API_KEY="your_groq_api_key_here"
```

---

## 🎨 Component Locations

### Dashboard Components
```
src/components/dashboard/
├── DashboardHeader.tsx          ← KPI cards with enhanced animations
├── ICCRankings.tsx              ← Live rankings with API integration
├── LiveMatches.tsx
├── IPLConsole.tsx
├── WinProbabilityCalculator.tsx
├── FantasyCommandCenter.tsx
├── MicroBattleAnalysis.tsx
├── QuickActions.tsx
└── PlayerFormDashboard/
    ├── index.tsx                ← Main container with player picker
    ├── XIRecommendations.tsx    ← 11-player cards with images
    ├── FormTrendsChart.tsx
    ├── VenueOpponentChart.tsx
    ├── WorkloadChart.tsx
    └── ConsistencyChart.tsx
```

### API Routes
```
src/app/api/
├── player-image/
│   └── route.ts                 ← Updated with Cricinfo integration
├── icc-rankings/
│   └── route.ts                 ← NEW: Live ICC rankings endpoint
├── dashboard/
│   ├── summary/route.ts
│   ├── team-logo/route.ts
│   └── ipl-team/route.ts
├── players/route.ts
├── form-trends/route.ts
├── venue-opponent/route.ts
├── xi-recommendations/route.ts
├── workload/route.ts
└── consistency/route.ts
```

---

## 🛠️ Debugging Tips

### Check Dev Server Logs
```bash
# View running processes
npm run dev

# Output shows in terminal with request logs:
# GET /api/player-image?name=... 200 in 150ms
```

### Browser Console Checks
```javascript
// Test API endpoint directly
fetch('/api/icc-rankings?format=T20')
  .then(r => r.json())
  .then(console.log)

// Check SWR cache
console.log(window.__SWR_CACHE__)

// Monitor image loading
document.querySelectorAll('img').forEach(img => {
  console.log(img.src, img.complete ? '✓' : '✗')
})
```

### Network Tab Filters
```
Filter by:
- "player-image"  → See all player image requests
- "icc-rankings"  → See rankings API calls
- "Status:404"    → Find broken resources
```

---

## 📊 Performance Optimization

### Image Loading
```typescript
// Lazy load images with Intersection Observer
loading="lazy"

// Use Next.js Image component (future improvement)
import Image from 'next/image'
<Image src={url} width={64} height={64} alt="..." />
```

### API Caching
```typescript
// SWR config in components
useSWR('/api/endpoint', fetcher, {
  revalidateOnFocus: false,     // Don't refetch on tab focus
  refreshInterval: 30 * 60 * 1000, // Refresh every 30 min
  revalidateIfStale: false,     // Use cache even if stale
})

// Next.js fetch caching
fetch(url, {
  next: { revalidate: 3600 }    // Cache for 1 hour
})
```

---

## 🎯 Key Files Modified (July 6, 2026)

### New Files
- `src/app/api/icc-rankings/route.ts`
- `IMPLEMENTATION_SUMMARY.md`
- `TESTING_GUIDE.md`
- `QUICK_REFERENCE.md`

### Modified Files
- `src/app/api/player-image/route.ts` - Added ESPN Cricinfo integration
- `src/components/dashboard/ICCRankings.tsx` - Added live feed badge, loading state
- `src/components/dashboard/DashboardHeader.tsx` - Enhanced hover animations
- `src/app/globals.css` - Added scrollbar styling, shimmer animation
- `src/app/page.tsx` - Improved section spacing

---

## 🔍 Common Issues & Solutions

### Issue: Player images not loading
**Solution:**
1. Check browser console for 404 errors
2. Verify `RAPIDAPI_KEY` in `.env`
3. Test direct URL: `/api/player-image?name=Virat+Kohli`
4. SVG fallback should always work (shows initials)

### Issue: ICC Rankings shows fallback data
**Solution:**
1. Check Network tab for `/api/icc-rankings` request
2. Inspect response body for error messages
3. Verify RapidAPI key is valid and not rate-limited
4. Expected behavior if API is down - app still works!

### Issue: TypeScript errors
**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm ci

# Regenerate Prisma client
npx prisma generate

# Check types
npx tsc --noEmit
```

### Issue: Dev server not updating
**Solution:**
1. Hard refresh: `Ctrl+Shift+R`
2. Clear browser cache
3. Restart dev server: `npm run dev`
4. Check for TypeScript errors blocking compilation

---

## 📞 Support Resources

### Documentation
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- SWR Docs: https://swr.vercel.app
- Tailwind CSS: https://tailwindcss.com/docs

### API Documentation
- RapidAPI Cricket Live Data: https://rapidapi.com/sportcontentapi/api/cricket-live-data
- ESPN Cricinfo CDN: `https://img1.hscicdn.com/image/upload/...`

### Internal Documentation
- `IMPLEMENTATION_SUMMARY.md` - Detailed changes log
- `TESTING_GUIDE.md` - Comprehensive test scenarios
- `README.md` - Project overview
- `prisma/schema.prisma` - Database schema

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run build` successfully
- [ ] All tests pass
- [ ] Environment variables configured on hosting platform
- [ ] Database migrations applied to production DB

### Hosting Platform Config (Vercel/Netlify)
```bash
# Build Command
npm run build

# Output Directory
.next

# Install Command
npm ci

# Environment Variables (copy from .env)
DATABASE_URL=***
RAPIDAPI_KEY=***
GOOGLE_API_KEY=***
# ... etc
```

### Post-Deployment
- [ ] Verify production URL loads
- [ ] Check player images on live site
- [ ] Test ICC Rankings API in production
- [ ] Monitor error logs (Vercel/Netlify dashboard)
- [ ] Set up alerts for API failures

---

## 💡 Pro Tips

### Keyboard Shortcuts (VS Code)
- `Ctrl+P` - Quick file open
- `Ctrl+Shift+F` - Global search
- `F2` - Rename symbol (TypeScript-aware)
- `Ctrl+Space` - Trigger IntelliSense

### Browser DevTools
- `Ctrl+Shift+C` - Inspect element
- `Ctrl+Shift+M` - Toggle device toolbar (mobile view)
- `Ctrl+Shift+P` - Command palette
- `F12` - Toggle DevTools

### Git Workflow
```bash
# Check status
git status

# Stage specific files
git add src/app/api/player-image/route.ts

# Commit with message
git commit -m "feat: integrate ESPN Cricinfo player images"

# Push to remote
git push origin main
```

---

**Last Updated:** July 6, 2026  
**Version:** v2.0.0 - Cricinfo Integration + ICC Rankings  
**Status:** ✅ Ready for Testing
