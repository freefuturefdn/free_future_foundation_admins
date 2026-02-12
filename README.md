# Free Future Foundation Admin

A fully-functional, security-focused admin dashboard built with **React + TypeScript + Vite + Bootstrap + Supabase**.

## Requirements
- Node.js 18+
- npm (ships with Node)
- A Supabase project with the schema from `description.txt`

## Setup
```bash
npm install
```

Create a `.env.local` with your Supabase project keys:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development
```bash
npm run dev
```
The dev server defaults to http://localhost:5173.

## Production build
```bash
npm run build
npm run preview
```

## Architecture

### Authentication & Authorization
- Login via Supabase `signInWithPassword`.
- After login, the user's email is matched against the `account-types` table to determine their role.
- Four roles: `super_admin`, `admin`, `team_member`, `manager`.
- Centralized permissions in `src/lib/permissions.ts` control per-module CRUD access.
- Password reset is contact-only (CEO/admin) — no public reset link.

### Role Permissions Summary

| Module         | super_admin | admin       | team_member | manager     |
|----------------|-------------|-------------|-------------|-------------|
| Accounts       | CRUD        | CRU*        | —           | —           |
| Board Members  | CRUD        | —           | —           | —           |
| Events         | CRUD        | CRUD        | CRUD        | CR U        |
| Gallery        | CRUD        | CRUD        | CR          | CR U        |
| News           | CRUD        | CRUD        | CRUD        | CR U        |
| Team Members   | CRUD        | CRUD        | —           | —           |
| Volunteers     | CRUD        | CRUD        | CRUD        | —           |
| Podcasts       | CRUD        | CRUD        | CRUD        | CR U        |
| Donations      | R           | R           | R           | —           |
| Partnerships   | R           | R           | R           | —           |
| Newsletter     | R + CSV     | R + CSV     | —           | —           |

*Admin can only manage `team_member` and `manager` accounts.

### Dashboard Modules (all in `src/pages/`)
- **DashboardHome** — overview with role info and quick-access cards
- **AccountsPage** — CRUD user accounts in `account-types`
- **BoardPage** — CRUD board members (super_admin only)
- **EventsPage** — CRUD events with status, category, attendees
- **GalleryPage** — CRUD images/videos with status management
- **NewsPage** — CRUD news articles with auto-slug
- **VolunteersPage** — CRUD volunteers **filtered by year** (per requirements)
- **TeamPage** — CRUD team member profiles
- **PodcastsPage** — CRUD podcast episodes
- **DonationsPage** — view-only donations table
- **PartnershipsPage** — view-only partnership inquiries
- **NewsletterPage** — view subscribers + export CSV

### Key Files
```
src/
  lib/
    supabaseClient.ts   # Supabase client + types
    permissions.ts      # Centralized RBAC
  context/
    AuthContext.tsx      # Auth state + login/logout
  components/
    LoginPage.tsx       # Split login/mission landing page
    DashboardLayout.tsx # Sidebar + Outlet layout
    ProtectedRoute.tsx  # Auth guard
  pages/
    DashboardHome.tsx   # Welcome + quick access
    AccountsPage.tsx    # Account management
    BoardPage.tsx       # Board members
    EventsPage.tsx      # Events
    GalleryPage.tsx     # Gallery
    NewsPage.tsx        # News
    VolunteersPage.tsx  # Volunteers (year-filtered)
    TeamPage.tsx        # Team members
    PodcastsPage.tsx    # Podcasts
    DonationsPage.tsx   # Donations (view-only)
    PartnershipsPage.tsx # Partnerships (view-only)
    NewsletterPage.tsx  # Newsletter subscribers + CSV export
  App.tsx               # Routing
  main.tsx              # Entry point
  styles.css            # Custom theme
```
