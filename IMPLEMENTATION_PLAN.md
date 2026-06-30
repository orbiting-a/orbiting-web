# Orbiting Web — Complete Implementation Plan

## 1. Current Architecture

```
orbiting-web/          (Next.js 16 + React 19 + Supabase + Tailwind v4)
├── 22 routes          (all building, zero errors)
├── 35+ Supabase queries (profiles, orbits, posts, likes, comments, follows,
│                         channels, messages, notifications, search, radar)
├── 8 reusable components  (PostCard, CreatePost, OrbitCard, ChatList,
│                            MessageList, ChatInput, RadarMap, ChakraFilter)
└── 2 SQL migrations   (schema + RLS/realtime/triggers)
```

**Clients:** Web (you build here) + Flutter app (already built, needs Supabase migration)

**Backend:** Supabase (managed PostgreSQL, Auth, Storage, Realtime)

**Hosting:** Vercel (free tier)

---

## 2. Current App State (April 2026)

### COMPLETE (5 routes — fully functional, real data)

| Route | Features |
|-------|----------|
| `/radar` | Leaflet dark map, geolocation, nearby orbits/users/events, radius filter, type filter, markers with popups, re-center |
| `/chat/[channelId]` | Real-time messaging via Supabase Realtime, DM/channel support, Enter-to-send, auto-scroll |
| `/notifications` | Real list from DB, mark-all-read, typed icons, unread badge styling |
| `/search` | Real full-text search across orbits, profiles, posts; debounced; filter tabs |
| `/create-orbit` | Form with name, description, category, public/private, redirects on success |

### PARTIAL (5 routes — functional but missing some features)

| Route | What Works | What's Missing |
|-------|------------|----------------|
| `/feed` | Real posts from joined/public orbits, CreatePost with image upload, like/unlike | No infinite scroll, no error state, no own-account posts in feed |
| `/discover` | Real orbit listing, category filters, search, join/leave toggle | No pagination, categories are hardcoded not from DB |
| `/chat` | Real channel list from DB, active highlighting | Search/filter buttons decorative, no DM creation entry point |
| `/profile/[id]` | Real profile data, follow/unfollow, orbits grid, 3 tabs | Posts tab never fetches posts; Saved/Liked tabs are empty; Message/Edit buttons have no handlers |
| `/orbit/[slug]` | Real orbit data, posts feed, create post, join/leave | Members/Events tabs are placeholder; no pagination for posts |

### STUB (4 routes — UI built, no backend wiring)

| Route | What Works | What's Missing |
|-------|------------|----------------|
| `/post/[id]` | Back button, action bar (decorative) | Full rewrite — no data fetch, no comments, no likes, no media |
| `/settings` | Sections with icons and chevrons | Every link is `#`, no actual settings functionality, no logout handler |
| `/wallet` | Connected/disconnected UI, balance card | Entirely mock — no MetaMask/WalletConnect, no real SOLO balance, no send/receive |
| `/create-activity` | Form UI with title/description/date/location | Submit navigates to `/feed` without saving; no orbit selector |

### MISSING (entire features from Flutter app)

| Feature | Flutter Status | Web Status |
|---------|---------------|------------|
| Challenges system | 3 screens | **Not started** |
| Treasure hunts | 12 screens | **Not started** |
| Polls (standalone) | 4 screens | **DB tables exist, no UI** |
| Events (RSVP, calendar) | 5 screens | **DB tables exist, no UI** |
| Orbit admin (members, roles, requests) | 8 screens | **Not started** |
| Account settings (17 sub-pages) | 17 screens | **Not started** |
| Avatar creation | 2 screens | **Not started** |
| Forgot password flow | 2 screens | **Not started** |
| Create channel / group chat | 2 screens | **Not started** |

---

## 3. Database Setup (SQL Migrations to Run)

### ✅ Already Run
- `supabase/migrations/00001_initial_schema.sql` — All tables, indexes, triggers, RLS, storage bucket

### 📋 Queue to Run
- `supabase/migrations/00002_fix_rls_and_realtime.sql` — Fixes orbit_members RLS recursion, enables Realtime for messages/channels, auto-notification triggers

### 📋 To Create

#### `00003_wallet.sql` (Web3 wallet tables)
```sql
-- Wallet balances
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  address TEXT,           -- Ethereum address
  sol_balance DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('send', 'receive', 'reward')),
  amount DECIMAL NOT NULL,
  from_address TEXT,
  to_address TEXT,
  tx_hash TEXT,            -- blockchain tx hash (null if internal)
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collectibles/NFTs
CREATE TABLE collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  contract_address TEXT,   -- NFT contract address
  token_id TEXT,           -- NFT token ID
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `00004_challenges.sql` (Challenges & activities)
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orbit_id UUID REFERENCES orbits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('photo', 'video', 'text', 'location')),
  cover_url TEXT,
  location JSONB,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `00005_treasure_hunts.sql` (Treasure hunt tables)
```sql
-- Already exists: treasure-hunt, th-riddle-poll, treasure-hunt-answer in backend
-- Need web-optimized schema
CREATE TABLE treasure_hunts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE riddles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treasure_hunt_id UUID REFERENCES treasure_hunts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  level INT DEFAULT 1,
  answer_type TEXT CHECK (answer_type IN ('code', 'location')),
  answer TEXT,
  lat DECIMAL,
  lng DECIMAL,
  max_score INT DEFAULT 100
);
```

---

## 4. Implementation Phases

### Phase A: Fix Critical Gaps (Week 1)

These are the unfinished core features that break the UX.

| # | Task | Files | Effort |
|---|------|-------|--------|
| A1 | **Fix post detail page** — fetch real post, show comments, submit comments, like | `app/(main)/post/[id]/page.tsx`, `queries.ts` (uses existing) | 2h |
| A2 | **Fix profile posts tab** — fetch user's posts from Supabase | `app/(main)/profile/[id]/page.tsx` (add `getUserPosts` query) | 1h |
| A3 | **Wire profile Message button** — call `createDMChannel` | `app/(main)/profile/[id]/page.tsx`, `queries.ts` (uses existing) | 0.5h |
| A4 | **Wire profile Edit Profile button** — link to `/settings` or inline edit | `app/(main)/profile/[id]/page.tsx` | 0.5h |
| A5 | **Wire Navbar search input** — navigate to `/search?q=query` on Enter | `components/layout/Navbar.tsx` | 0.5h |
| A6 | **Fix login/signup in Navbar chat tab** — remove decorative search/filter handlers | `app/(main)/chat/page.tsx` | 1h |
| A7 | **Fix create-activity** — wire to Supabase insert with orbit selector | `app/(main)/create-activity/page.tsx` | 2h |
| A8 | **Add Logout handler** in settings | `app/(main)/settings/page.tsx`, `lib/auth.ts` (add logout) | 0.5h |
| A9 | **Add infinite scroll** to feed page | `app/(main)/feed/page.tsx` (Intersection Observer) | 2h |
| A10 | **Add pagination** to discover page | `app/(main)/discover/page.tsx` (Load More button) | 1h |

**Total: ~11 hours**

---

### Phase B: Admin Panel (Week 2)

Merge orbit-admin into the web app at `/admin` route (per your earlier decision).

| # | Task | Reuse From | Effort |
|---|------|------------|--------|
| B1 | Create admin layout with sidebar nav | `orbiting-admin-main/src/app/admin/layout.tsx` (rewrite in Tailwind) | 3h |
| B2 | Dashboard — DAU/MAU, orbit stats, growth charts | New (use Supabase queries + recharts) | 4h |
| B3 | User management — list, search, ban, verify users | New (admin RLS role needed) | 4h |
| B4 | Orbit management — approve, feature, moderate | New | 3h |
| B5 | Content moderation — reported posts queue | New (add `complaints` table) | 3h |
| B6 | Treasure hunt builder | `orbiting-admin-main` create-treasure-hunt (port to Tailwind) | 4h |

**Total: ~21 hours**

---

### Phase C: Settings & Account (Week 2-3)

The Flutter app has 17 settings sub-pages. Build the 8 most important.

| # | Task | Effort |
|---|------|--------|
| C1 | Profile editing (name, username, bio, avatar upload) | 3h |
| C2 | Change password page | 1h |
| C3 | Privacy & Security page (2FA toggle, login activity) | 2h |
| C4 | Notification preferences | 2h |
| C5 | Blocked users list | 1h |
| C6 | Language selection | 1h |
| C7 | Terms & Privacy pages (static) | 0.5h |
| C8 | Delete account flow | 1h |

**Total: ~11.5 hours**

---

### Phase D: Web3 Wallet (Week 3)

| # | Task | Effort |
|---|------|--------|
| D1 | Install wagmi + viem + WalletConnect SDK | 1h |
| D2 | Wallet connection — MetaMask + WalletConnect | 4h |
| D3 | SOLO token balance display | 2h |
| D4 | Send tokens form (address + amount) | 2h |
| D5 | Transaction history list | 2h |
| D6 | NFT/collectibles gallery | 2h |
| D7 | Wallet page polish | 1h |

**Total: ~14 hours**

---

### Phase E: Events, Polls & Activities (Week 3-4)

| # | Task | Effort |
|---|------|--------|
| E1 | Event creation form (title, description, date, location, orbit) | 2h |
| E2 | Event detail page with RSVP | 2h |
| E3 | Events calendar view (on orbit page) | 2h |
| E4 | Poll creation (embedded in post creation) | 2h |
| E5 | Poll voting UI | 1h |
| E6 | Activity feed cards (event/poll cards in feed) | 2h |

**Total: ~11 hours**

---

### Phase F: Challenges & Treasure Hunts (Week 4)

| # | Task | Effort |
|---|------|--------|
| F1 | Challenge creation form | 3h |
| F2 | Challenge detail page (with sub-tasks) | 2h |
| F3 | Challenge listing on orbit page | 1h |
| F4 | Treasure hunt info page | 2h |
| F5 | Riddle map (Leaflet with riddle markers) | 3h |
| F6 | Code/location answer input | 1h |
| F7 | Treasure hunt leaderboard | 2h |
| F8 | Rewards & feedback screens | 1h |

**Total: ~15 hours**

---

### Phase G: Orbit Admin (Week 5)

| # | Task | Effort |
|---|------|--------|
| G1 | Member management (list, remove, role change) | 3h |
| G2 | Moderator management (add/remove) | 2h |
| G3 | Member requests approval queue | 2h |
| G4 | Activity/channel request management | 2h |
| G5 | Orbit settings (name, image, privacy, policies, social links) | 3h |
| G6 | Orbit analytics (member growth, post activity) | 2h |

**Total: ~14 hours**

---

### Phase H: Polish & Performance (Week 5-6)

| # | Task | Effort |
|---|------|--------|
| H1 | PWA manifest + service worker (offline support) | 3h |
| H2 | SEO metadata for all dynamic routes | 2h |
| H3 | OG image generation (port from old website) | 2h |
| H4 | Performance audit (Lighthouse ≥ 90) | 2h |
| H5 | Error boundaries on all routes | 1h |
| H6 | Loading skeletons for all pages | 2h |
| H7 | Page transition animations | 2h |

**Total: ~14 hours**

---

### Phase I: iOS & Android Deep Linking (Week 6)

| # | Task | Effort |
|---|------|--------|
| I1 | Configure Supabase auth redirect URLs for mobile | 1h |
| I2 | Add universal links / app links support | 2h |
| I3 | Update Flutter app to use Supabase (migrate from Strapi) | 8h |
| I4 | Shared auth session between web and mobile | 3h |

**Total: ~14 hours**

---

## 5. Infrastructure & Deployment

### Hosting: Vercel (Free Tier)

```
Framework Preset: Next.js
Build Command:    next build
Output Dir:       .next
Environment:      Node.js 20.x
Domain:           orbiting.in (or your domain)
```

### Environment Variables to Set

```
NEXT_PUBLIC_SUPABASE_URL=https://issymeofzaxaocquapgs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        (keep server-side only)
NEXT_PUBLIC_APP_URL=https://orbiting.in
NEXT_PUBLIC_APP_NAME=Orbiting
```

### Supabase Settings

```
Auth > Settings > Site URL:     https://orbiting.in
Auth > Settings > Redirect URLs: https://orbiting.in/auth/callback
Auth > Settings > External OAuth: Google, Apple (configured as needed)
Storage > orbit-media bucket:   Public (created by migration 00001)
API > Settings > JWT expiry:    3600 (1 hour, default)
Realtime > Enabled tables:      messages, channels, channel_members (migration 00002)
```

### CI/CD (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 6. Cost Breakdown

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Supabase** | Free | $0 | 500MB DB, 1GB storage, 50K MAU, Realtime up to 200 CCU |
| **Vercel** | Free (Hobby) | $0 | 100GB bandwidth, 6000 build mins/mo |
| **Leaflet/OSM** | Free | $0 | No API key needed |
| **Resend** | Free | $0 | 3,000 emails/mo |
| **Sentry** | Free | $0 | 5K events/mo |
| **MSG91** | Pay-as-you-go | ~$5-20/mo | SMS OTP — only real cost |
| **Domain** | ~$10/yr | ~$1/mo | orbiting.in or similar |
| **TOTAL** | | **~$6-21/mo** | |

### What You're NOT Paying For (vs old stack)

| Old Service | Old Cost | Now |
|-------------|----------|-----|
| Google Maps API | ~$200/mo | **$0** (Leaflet) |
| Stream Chat | ~$200-400/mo | **$0** (Supabase Realtime) |
| Strapi on EC2 | ~$30/mo | **$0** (Supabase DB) |
| AWS S3 | ~$10/mo | **$0** (Supabase Storage) |
| MeiliSearch (EC2) | ~$10/mo | **$0** (PG full-text) |
| Mailgun | ~$15/mo | **$0** (Resend) |
| New Relic | ~$30/mo | **$0** (Sentry free) |
| Twilio | ~$10-50/mo | **~$5-20/mo** (MSG91) |
| **Total** | **~$505-745/mo** | **~$6-21/mo** |

---

## 7. Getting to MVP (Minimum Viable Path)

If you want the app functional for users **fast**, skip everything and do only:

```
Step 1: Run migration 00002 (fix RLS + enable Realtime)
Step 2: Complete Phase A (fix critical gaps) — ~11 hours
Step 3: Deploy to Vercel
```

This gives you:
- ✅ User signup/login
- ✅ Feed with real posts
- ✅ Create posts with images
- ✅ Like and comment on posts
- ✅ Discover and join orbits
- ✅ Create orbits
- ✅ Real-time chat (DMs + orbit channels)
- ✅ Radar map discovery
- ✅ Search (orbits, people, posts)
- ✅ Notifications (likes, comments, follows)
- ✅ User profiles with follow/unfollow
- ✅ Settings page (logout working)

**Everything else** (wallet, admin panel, treasure hunts, challenges, events, polls, settings sub-pages, orbit admin) can be added incrementally after launch.

---

## 8. Immediate Next Steps

```
┌─────────────────────────────────────────────────────┐
│  1. Run migration 00002 in Supabase SQL Editor       │
│  2. npm run build (should pass, already verified)    │
│  3. npm run dev (test auth flow locally)             │
│  4. Deploy to Vercel                                 │
└─────────────────────────────────────────────────────┘
```

The build already passes with zero errors. The app is ready to deploy once migrations are applied.
