# GymBro App — Developer Guide

## Project Overview

GymBro is an AI-powered personal fitness trainer app. Users chat with an AI agent that knows their profile, goals, and fitness history. Built with Angular 20 frontend + NestJS backend + Supabase + DeepSeek V3.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20.1, standalone, zoneless, SSR |
| Backend | NestJS (in `backend/` folder) |
| Auth | Supabase Auth (JWT) |
| Database | Supabase PostgreSQL |
| AI | DeepSeek V3 (`deepseek-chat` model, OpenAI-compatible API) |

## Running the App

### Development
```bash
# Terminal 1 — NestJS backend
cd backend && npm run start:dev

# Terminal 2 — Angular frontend (proxies /api to localhost:3000)
npm start
```

### Production (SSR)
```bash
npm run build
npm run serve:ssr:gymbro-app
```

### Tests
```bash
npm test                    # Angular Karma tests
cd backend && npm test      # NestJS Jest tests
```

## Project Structure

```
gymbro-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/            # AuthService, guards, interceptor
│   │   │   └── services/        # ApiService (base HTTP wrapper)
│   │   ├── features/
│   │   │   ├── auth/            # Login/signup page
│   │   │   ├── onboarding/      # Profile setup form
│   │   │   ├── dashboard/       # Home dashboard
│   │   │   └── chat/            # AI trainer chat
│   │   └── shared/components/   # Nav, reusable components
│   ├── environments/            # Dev/prod environment config
│   └── server.ts                # Express SSR server (proxies /api to NestJS)
├── backend/                     # NestJS API
│   └── src/
│       ├── auth/                # JWT strategy (Supabase JWKS)
│       ├── users/               # Profile CRUD
│       └── chat/                # AI chat + history
├── proxy.conf.json              # Dev server proxy (/api -> localhost:3000)
└── CLAUDE.md
```

## Angular Conventions

This is an **Angular 20 zoneless standalone application**. Follow these patterns strictly:

### Component Pattern
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  private readonly service = inject(SomeService);

  readonly items = signal<Item[]>([]);
  readonly count = computed(() => this.items().length);
  readonly isLoading = signal(false);
}
```

### Key Rules
- Always `standalone: true` — never use NgModules
- Always `ChangeDetectionStrategy.OnPush` — required for zoneless
- Use `inject()` — never constructor injection
- Use `signal()` for mutable state, `computed()` for derived state
- Use `httpResource()` for GET data fetching (declarative, signal-integrated)
- Use `HttpClient` for mutations (POST, PUT, DELETE)
- All routes use `loadComponent()` for lazy loading
- Guards are functional (`CanActivateFn`), never class-based

### HttpClient Setup
`provideHttpClient(withFetch(), withInterceptors([authInterceptor]))` — `withFetch()` is required for SSR.

### SSR Rules
- Auth-gated routes use `RenderMode.Client` in `app.routes.server.ts`
- Never access `localStorage`/`window`/`document` directly — use `isPlatformBrowser()` check or `afterNextRender()`
- `/api` requests are proxied to NestJS by `server.ts` in production

## NestJS Conventions

- All controllers have `@UseGuards(JwtAuthGuard)` at class level
- `req.user.userId` contains the authenticated Supabase user UUID
- All routes are prefixed with `/api` (set globally in `main.ts`)
- Use `class-validator` DTOs for all request bodies
- `SupabaseService` uses the service role key — bypasses RLS

## Authentication Flow

1. User logs in via Supabase Auth REST (`/auth/v1/token`)
2. JWT stored in `localStorage`
3. `authInterceptor` attaches `Authorization: Bearer <token>` to all `/api` requests
4. NestJS validates JWT via Supabase JWKS endpoint
5. On 401, interceptor auto-refreshes token and retries

## Environment Variables

### Angular (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: '/api',
  supabaseUrl: 'https://YOUR.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
};
```

### NestJS (`backend/.env`)
```
SUPABASE_URL=https://YOUR.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY
DEEPSEEK_API_KEY=YOUR_KEY
PORT=3000
```

## Database Schema (Supabase PostgreSQL)

### profiles
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, FK to auth.users |
| name | TEXT | |
| age | INTEGER | |
| height_cm | NUMERIC(5,1) | |
| weight_kg | NUMERIC(5,2) | |
| gender | TEXT | male/female/other/prefer_not_to_say |
| fitness_goal | TEXT | lose_weight/build_muscle/improve_endurance/... |
| activity_level | TEXT | sedentary/lightly_active/moderately_active/... |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-updated via trigger |

### chat_messages
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK to auth.users |
| role | TEXT | user/assistant |
| content | TEXT | |
| created_at | TIMESTAMPTZ | indexed (user_id, created_at DESC) |

## AI Agent Context

The DeepSeek V3 system prompt includes:
- User's full profile (name, age, height, weight, gender, goal, activity level)
- Current date
- Last 20 chat messages as conversation history
- Role: professional personal fitness trainer

Model: `deepseek-chat` via `https://api.deepseek.com` (OpenAI-compatible endpoint).

## MCP Servers in Use

- **Supabase MCP** (`@supabase/mcp-server-supabase`) — run SQL migrations, query tables, manage auth
- **Playwright MCP** (`@playwright/mcp`) — E2E browser testing of the Angular app
- **GitHub MCP** (`@modelcontextprotocol/server-github`) — issue/PR management

## Design System

Clean, light & minimal — health app aesthetic.

```scss
--bg-primary: #ffffff
--bg-secondary: #f8f9fa
--accent: #4f9cf9      // blue
--text-primary: #1a1a2e
--radius: 12px
```

Font: `-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`
