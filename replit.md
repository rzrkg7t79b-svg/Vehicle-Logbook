# Bodyshop Vehicle Tracker

## Overview

A mobile-first vehicle tracking application for a body shop (SIXT branding). The system allows staff to log vehicles with German license plates, track 7-day countdown timers for vehicle processing, add comments, and manage users with PIN-based authentication. The application is designed for internal use with role-based access control.

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
- **Users**: Staff members with initials, 4-digit PIN, roles array, and admin flag
- **Vehicles**: License plates, names, notes, EV status, collection status, countdown timers
- **Comments**: Linked to vehicles with user initials and timestamps

### Authentication
- **Method**: PIN-based authentication (4-digit codes)
- **Session**: Client-side session storage with 5-minute timeout
- **Admin Access**: Separate admin PIN header for protected operations
- **Context**: React Context (`UserContext`) provides current user state

### Key Design Decisions

1. **Shared Route Definitions**: API routes are defined once in `shared/routes.ts` with Zod schemas, ensuring type-safe API contracts between frontend and backend.

2. **Mobile-First UI**: The app is constrained to `max-w-md` width with bottom navigation, optimized for phone use in a workshop environment.

3. **7-Day Countdown Logic**: Vehicles have a `countdownStart` timestamp; the UI calculates remaining time client-side using `date-fns`.

4. **German License Plate Component**: Custom `GermanPlate` component renders EU-style plates with blue stripe and stars.

5. **Build Strategy**: Production builds use esbuild for server bundling (with dependency allowlist for cold start optimization) and Vite for client bundling.

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