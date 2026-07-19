# Atlas Hub

> El Hub donde tu IA crea, organiza y entrega.

Atlas Hub is an AI-native command center dashboard for agencies and businesses that work with AI agents. Visualize everything your AI produces — documents, images, videos, tasks — organized by project and client.

## Features (MVP)

- Project dashboard with progress tracking
- File gallery (docs, images, videos) with in-browser preview
- Real-time activity feed
- AI agent chat integration
- Global search (Cmd+K)
- Bilingual: Spanish / English toggle
- Dark mode native (Linear/Vercel aesthetic)
- Mobile responsive

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime)
- **Deployment:** Coolify + Docker
- **AI Backend:** Hermes Agent (via webhooks)
- **Billing:** Stripe (SaaS phase)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  app/
    [locale]/
      (dashboard)/     # Main app pages (authenticated)
      (auth)/          # Login/signup pages
    globals.css        # Global styles + design tokens
    layout.tsx         # Root layout (fonts, metadata)
  components/
    layout/            # Sidebar, Topbar, DashboardLayout
    dashboard/         # ProjectCard, ActivityFeed, AgentChat
    ui/                # shadcn/ui primitives
  i18n/                # Bilingual config (ES/EN)
  messages/            # Translation files (es.json, en.json)
  lib/                 # Utilities (supabase clients, etc.)
```

## License

Proprietary — GlennGO (c) 2026
