# MasterSIXT Workshop Management

## Overview

A comprehensive mobile-first iOS web app for SIXT workshop management with seven integrated modules (v3.1.1):

- **MasterSIXT** (Main Dashboard): Global progress bar, daily 16:30 deadline countdown, module status overview
- **TimeDriverSIXT**: Labor planning budget tool with rentals input, driver selection, and fair working time distribution
- **UpgradeSIXT**: Daily UP vehicle management with 08:30 deadline, sold/pending tracking for upsell vehicles, max 2 pending vehicles, car/van type selection
- **FlowSIXT**: Driver task management with priority ordering and completion tracking
- **BodyshopSIXT**: Vehicle tracking with German license plates and 7-day timers
- **ToDoSIXT**: Daily task management with admin CRUD, task types (Recurring/One-Time), priority system (!!!/!!/!/none), and user completion
- **QualitySIXT**: Quality checks with automatic driver task creation for failed checks
- **FutureSIXT**: Tomorrow's planning with reservation tracking (Car/Van/TAS split), deliveries, and collections

The system includes PIN-based authentication, role-based access (Branch Manager, Counter, Driver), German timezone support (Europe/Berlin), and module completion tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for list and page transitions
- **Build Tool**: Vite with custom Replit plugins

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod validation
- **Development**: Vite middleware for HMR in development, static serving in production

### Data Storage
- **Database**: PostgreSQL via `node-postgres` (pg)
- **ORM**: Drizzle ORM with Zod schema validation (`drizzle-zod`)
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command

### Core Data Models
- **Users**: Staff members with initials, 4-digit PIN, roles array, admin flag, maxDailyHours (supports half hours like 5.5), and hourlyRate (EUR/hour)
- **AppSettings**: Key-value store for configurable settings (e.g., budgetPerRental)
- **Vehicles**: License plates, names, notes, EV status, collection status, countdown timers
- **Comments**: Linked to vehicles with user initials and timestamps
- **Todos**: Daily tasks with title, completion status, completedBy user, isRecurring flag, priority (0-3)
- **QualityChecks**: License plate, passed status, comment, createdBy, date
- **DriverTasks**: Auto-created from failed quality checks, linked to qualityCheckId
- **FlowTasks**: Driver tasks with license plate, EV status, task type, optional needAt deadline, completion tracking
- **ModuleStatus**: Tracks daily completion status per module (timedriver, todo, quality)
- **UpgradeVehicles**: UP vehicles for upselling with license plate, model, reason, sold status, date tracking

### Authentication & Authorization
- **Method**: Backend API PIN-based authentication (4-digit codes) via POST /api/auth/login
- **User Storage**: Users stored in PostgreSQL database, seeded with default admin user (BM, PIN: 4266)
- **Session**: React memory only (useState) with 5-minute inactivity timeout - page reload requires re-login
- **Login Protection**: 3 failed attempts trigger 5-minute lockout with countdown timer (lockout state in localStorage for brute-force protection)
- **User Management**: Admin users can add/edit/delete users via /api/users endpoints with x-admin-pin header
- **Drivers API**: GET /api/drivers returns drivers list (public, no auth required)
- **Context**: React Context (`UserContext`) provides current user state
- **Role-Based Access**: Users tab visible only to admin users

### Key Design Decisions

1. **Frontend/Backend Separation**: The frontend and backend are architecturally separated for Vercel deployment:
   - Frontend types: `client/src/types.ts` (plain TypeScript interfaces, no drizzle/zod)
   - Frontend constants: `client/src/constants/index.ts` (flowTaskTypes, etc.)
   - Frontend API utilities: `client/src/api.ts` (API_PATHS, buildUrl)
   - Backend schemas: `shared/schema.ts` (Drizzle ORM + Zod validation)
   - Backend routes: `shared/routes.ts` (API contracts with Zod schemas)
   - The client folder has its own vite.config.ts and package.json for standalone Vercel builds

2. **Mobile-First UI**: The app is constrained to `max-w-md` width with bottom navigation, optimized for phone use in a workshop environment.

3. **7-Day Countdown Logic**: Vehicles have a `countdownStart` timestamp; the UI calculates remaining time client-side using `date-fns`.

4. **German License Plate Component**: Custom `GermanPlate` component renders EU-style plates with blue stripe and stars.

5. **Build Strategy**: Production builds use esbuild for server bundling (with dependency allowlist for cold start optimization) and Vite for client bundling.

6. **German Timezone**: All countdown calculations use Europe/Berlin timezone via utilities in `client/src/lib/germanTime.ts`.

7. **Module Routes**: 
   - `/` - MasterSIXT dashboard (main home)
   - `/timedriver` - TimeDriverSIXT morning checks
   - `/upgrade` - UpgradeSIXT daily UP vehicle management
   - `/flow` - FlowSIXT driver task management
   - `/bodyshop` - BodyshopSIXT vehicle tracking
   - `/todo` - ToDoSIXT task management
   - `/quality` - QualitySIXT quality checks

8. **Auto-Task Creation**: Failed quality checks automatically create driver tasks visible to users with Driver role.

9. **TimeDriverSIXT Features**:
   - Labor planning budget tool for calculating working time distribution
   - Input: Rentals today (number), Budget per rental in EUR (admin-editable, default 16.39 EUR)
   - Driver selection: Multi-select buttons showing initials and max daily hours
   - Each driver has individual hourly rate (EUR/hour) stored in their user account
   - Calculation: Total Budget = rentals × EUR per rental, then Working Hours = driverBudget ÷ hourlyRate
   - Results: Shows hours:minutes per driver (capped at their maxDailyHours), percent bar (100% = max daily hours)
   - After calculation: Inputs locked, "Done" indicator shown, "New Calculation" button to start fresh
   - Settings API: GET /api/settings/:key (public), PUT /api/settings/:key (admin-only)

10. **FlowSIXT Features**:
   - Counter/Admin can create tasks with license plate, EV toggle, and task type
   - Task types: refuelling, cleaning, AdBlue, delivery, collection, water, fast cleaning, Bodyshop collection, Bodyshop delivery, LiveCheckin, only CheckIN & Parking (multi-select buttons)
   - Optional "Need at (time)" deadline with countdown display showing "Need in Xh Ymin" or "overdue/immediately"
   - Tasks grouped by vehicle with completion progress (X/Y done)
   - Counter/Admin can reorder vehicle priority by drag-and-drop
   - Drivers can mark individual sub-tasks as done
   - Counter/Admin can mark completed sub-tasks as "undone" which sets needsRetry flag
   - Tasks with needsRetry show "Try again!" warning

11. **License Plate Input**: Reusable LicensePlateInput component with auto-focus between fields (city → letters → numbers) for faster data entry. Used in FlowSIXT, BodyshopSIXT, and QualitySIXT.

12. **ToDoSIXT Features**: Admin can assign todos to Counter and/or Driver roles. Non-admin users only see todos assigned to their role. Task types: Recurring (reset at midnight) and One-Time (persist until completed/deleted). Priority levels: 3=!!! (red), 2=!! (orange), 1=! (yellow), 0=none. Tasks sorted by priority (highest first).

13. **DriverSIXT View**: Dedicated view for driver-only users (Driver role without Counter/Admin). Shows combined FlowSIXT and ToDoSIXT tasks on one screen with personal progress bar. Drivers are automatically redirected to /driver instead of MasterSIXT dashboard.

14. **Real-Time Updates**: WebSocket server broadcasts changes to all connected clients. When any user makes changes (creates/updates/deletes tasks, vehicles, etc.), all other users see the updates instantly without refreshing. Implemented using `ws` package on the server and a custom React hook (`useRealtimeUpdates`) on the client.

15. **Dashboard Status API**: GET /api/dashboard/status?date=YYYY-MM-DD returns:
   - `timedriver`: { isDone, details } - done if calculation saved before 8:00
   - `todo`: { isDone, completed, total } - done if all todos completed
   - `quality`: { isDone, passedChecks, incompleteTasks } - done if 5+ passed checks AND no incomplete driver tasks
   - `bodyshop`: { isDone, vehiclesWithoutComment, total } - done if all active vehicles have daily comment (or no vehicles)
   - `future`: { isDone, isLocked, data } - locked before 15:00 Berlin time, done if planning saved
   - `overallProgress`: 0-100 percentage (calculated based on 7 completed modules)

16. **Midnight Reset Scheduler**: Automatically resets daily data at midnight Berlin time:
   - Recurring Todos: Marked as not completed (One-Time tasks persist)
   - Module status: Deleted for fresh day
   - Quality checks and driver tasks: Deleted
   - TimeDriver calculations: Deleted
   - UpgradeSIXT vehicles: Deleted for fresh day
   - FutureSIXT planning: Deleted for fresh day
   - Implemented in `server/scheduler.ts` using setTimeout with Berlin timezone calculation

17. **FutureSIXT Features**:
   - Tomorrow's planning module for anticipating next day's workload
   - Locked until 15:00 Berlin time each day (shows lock icon before unlock)
   - Admin early unlock: Tap the FutureSIXT card 3 times quickly, then enter admin PIN to unlock before 15:00
   - Input fields: Total reservations, Car/Van/TAS split, Deliveries Tomorrow, Collections Open
   - Validation: Car + Van + TAS must equal Total reservations (red border on error)
   - After save: Read-only mode with saved values displayed, "New" button to reset and start fresh
   - Displayed at bottom of MasterSIXT dashboard and at top of Export Preview when saved
   - API: POST /api/future-planning, GET /api/future-planning/:date, DELETE /api/future-planning/:date

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- `connect-pg-simple` for session storage capability

### UI Libraries
- Full shadcn/ui component suite (Radix UI primitives)
- Lucide React for icons
- `date-fns` for date manipulation
- `framer-motion` for animations
- `embla-carousel-react` for carousels
- `vaul` for drawer components
- `react-day-picker` for calendar
- `cmdk` for command palette
- `recharts` for charting

### Form Handling
- `react-hook-form` with `@hookform/resolvers`
- `zod` for validation throughout

### Development Tools
- Replit-specific Vite plugins (error overlay, cartographer, dev banner)

## Deployment Architecture

### Dual Deployment Support
The application supports two deployment modes:

1. **Replit Development/Production** (Current)
   - Express server with WebSocket for real-time updates
   - Entry point: `server/index.ts`
   - Full WebSocket support via `broadcastUpdate()`
   - Scheduler for midnight resets

2. **Vercel Serverless** (Optional)
   - Express wrapped in serverless functions
   - Entry point: `api/index.ts`
   - API folder structure:
     - `api/index.ts` - Serverless Express wrapper
     - `api/routes.ts` - All API route handlers (identical logic)
     - `api/storage.ts` - Database storage layer
     - `api/db.ts` - Serverless-compatible database connection
   - Note: WebSocket not supported in serverless (no real-time updates)
   - Note: Midnight scheduler won't run (use Vercel Cron Jobs instead)

### Vercel Configuration
`vercel.json` configures:
- Frontend build: `cd client && npm run build`
- Output: `client/dist`
- API routes: `/api/*` → serverless function
- SPA fallback: All other routes → `index.html`

### Environment Variables for Vercel
Required for deployment:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key