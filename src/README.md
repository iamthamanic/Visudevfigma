# VisuDEV - Professional Development Visualization Platform

**MVP Stufe 3** - Screen-centric dev tool that visualizes deterministic flows from UI elements through code, API, SQL/RLS to ERP systems.

## 🎯 Overview

VisuDEV is a professional platform for development teams that provides:

- **Screen-centric architecture visualization** - Click any UI element to trace its execution flow
- **Deterministic flow graphs** - Visualize the complete path from UI → API → SQL → RLS → ERP
- **Code intelligence** - Direct GitHub permalinks to exact lines of code (with SHA, not branch)
- **Database transparency** - ERD, RLS policy matrix, and migration history
- **Real-time updates** - GitHub webhooks and Supabase realtime for live sync

## 🏗️ Architecture

### Stack
- **Frontend**: React + TypeScript + Tailwind CSS (via Figma Make)
- **Backend**: Supabase (PostgreSQL, PostgREST, Edge Functions, Auth, Realtime)
- **Source Control**: GitHub (webhooks, permalinks, code introspection)
- **CI/CD**: GitHub Actions

### Data Flow
```
GitHub (source of truth)
  ↓ webhooks
Supabase Edge Functions (graph/build, github/webhook)
  ↓ introspection
PostgreSQL (projects, repos, nodes, edges, db_metadata)
  ↓ realtime
Frontend (Make UI)
```

## 📋 Features (MVP)

### 1. App/Flow Lens
- **Left Panel**: Live preview of app screen (Make-Publish/CI-Preview URL)
- **Right Panel**: 
  - Vertical step graph (fan-out/fan-in)
  - Node inspector with code snippets, metrics, and GitHub permalinks

### 2. Blueprint
- Code dependency graph (Routes → Components → Imports → API calls)
- Node-link visualization colored by layer
- Search and filter capabilities

### 3. Data
- **ERD Tab**: Entity-Relationship Diagram with tables and foreign keys
- **Policies Tab**: RLS policy matrix (table × role) with warnings for missing policies
- **Migrations Tab**: Complete migration history with commit SHAs

### 4. Logs & Tech Stack
- Real-time webhook events from GitHub
- Tech stack analysis from package.json
- Event timeline with delivery IDs

### 5. Settings
- GitHub integration status
- Supabase connection
- Webhook configuration
- RBAC (project roles: owner, maintainer, viewer)

## 🎨 UI/UX Design

### Layer Colors
- **Frontend** (UI): Blue `rgb(59, 130, 246)`
- **Compute** (API/Edge): Violet `rgb(139, 92, 246)`
- **Data** (SQL/Storage): Green `rgb(34, 197, 94)`
- **External** (ERP): Orange `rgb(249, 115, 22)`
- **Policies** (RLS): Gray `rgb(107, 114, 128)`

### Node Card Structure
Each node displays:
- Title, type icon, and description
- File path with line numbers
- Commit SHA (7 chars)
- Code snippet (10-20 lines)
- Metrics: avg_ms, p95_ms, err_rate
- Links: GitHub permalink, Supabase dashboard

## 🔗 Integrations

### GitHub
- **App Installation**: GitHub App with webhooks (push, pull_request)
- **Deep Links**: `https://github.com/{owner}/{repo}/blob/{sha}/{path}#L{start}-L{end}`
- **Source of Truth**: All code, commits, and files

### Supabase
- **PostgreSQL**: Multi-tenant data model with RLS
- **Edge Functions**: 
  - `github/webhook` - Ingest GitHub events
  - `graph/build` - AST parsing and graph construction
  - `supabase/introspect` - Database metadata extraction
  - `runs/ingest` - Metrics collection
- **Realtime**: Live updates for webhook events and runs
- **Auth**: JWT/OAuth for project members

## 📊 Data Model

### Core Tables
- `projects` - VisuDEV projects
- `members` - Project team members with roles
- `repos` - GitHub repositories
- `commits` - Git commit history
- `files` - Tracked source files

### Graph Tables
- `nodes` - Flow nodes (UI, API, SQL, Policy, ERP, etc.)
- `edges` - Connections between nodes (import, request, sql, policy)

### Database Metadata
- `db_tables` - Introspected database tables
- `db_policies` - RLS policies with SQL expressions
- `db_relations` - Foreign key relationships
- `db_migrations` - Applied migrations with SHAs

### Observability
- `webhook_events` - GitHub webhook deliveries
- `runs` - Node execution metrics

## 🚀 Example Flows

### Login Flow
```
UI: Login Button (#login)
  ↓ validate
UI: Form Validation
  ↓ POST
API: /api/login (Edge Function)
  ↓ auth
Auth: supabase.auth.signInWithPassword
  ↓ query
SQL: SELECT profiles WHERE user_id=auth.uid()
  ↓ enforce
Policy: profiles_select (auth.uid() = user_id)
  ↓ sync
ERP: ensureContact()
```

### Order Flow
```
UI: Order Submit Button (#order-submit)
  ↓ POST
Edge: /api/orders
  ↓ check
SQL: SELECT inventory
  ↓ insert
SQL: INSERT orders
  ↓ enforce
Policy: orders_insert (auth.uid() = user_id)
  ↓ sync
ERP: createSalesOrder()
  ↓ upload
Storage: invoice.pdf
```

## 🔒 Security

### Row-Level Security (RLS)
- All tables have RLS enabled
- `is_project_member(project_id)` helper function
- Policies enforce user can only access their projects
- Service role key never exposed to frontend

### GitHub Integration
- Webhook signature validation (X-Hub-Signature-256)
- Installation tokens with repository scope
- Deep links always use commit SHA (immutable)

## 📈 KPIs

- **Time-to-Understand**: < 15 min for new developers
- **Trace Depth**: ≤ 5 clicks from ticket to DB row
- **Coverage**: Every merged PR linked to at least one node/screen

## 🛠️ Implementation Notes

### Manifest-Driven
The `visudev.manifest.json` file defines:
- Screens and routes
- UI elements with selectors
- Bindings between steps (reads, writes, calls)

### GitHub Permalinks
Always use SHA-based permalinks, never branch names:
```
https://github.com/{owner}/{repo}/blob/{sha}/{path}#L{start}-L{end}
```

### Edge Function Architecture
- Bootstrap with Supabase client (service role)
- CORS enabled for frontend access
- Prefix all routes with `/make-server-edf036ef/`
- Log errors to console for debugging

## 📝 Future Enhancements (Beyond MVP)

- Real-time collaboration with presence
- AI-powered flow suggestions
- Performance regression detection
- Custom visualization layouts
- Multi-repo support
- Plugin system for custom integrations

## 🎓 Getting Started

1. **Connect GitHub**: Install GitHub App and configure webhooks
2. **Connect Supabase**: Link Supabase project with connection string
3. **Run Migrations**: Execute SQL migrations in Supabase SQL Editor
4. **Deploy Edge Functions**: Deploy via Supabase CLI or Dashboard
5. **Configure CI**: Set up GitHub Actions for type-gen and edge tests
6. **Start Developing**: Click UI elements to visualize flows!

---

**VisuDEV** - Making code execution flows transparent and traceable.
