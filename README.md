# VAPP - React + Vite + shadcn/ui

A modern React application with authentication and user session management.

## Features

- ⚡ React 18 + Vite for fast development
- 🎨 shadcn/ui components with Tailwind CSS
- 🔐 Authentication system with session management
- 🛣️ React Router for navigation
- 📱 Responsive design
- 🔄 Aggregate Pattern for data fetching (default)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend API URL
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## API Configuration

The app connects to a backend API. Configure the API URL in `.env`:

```
VITE_API_URL=http://localhost:8005
```

## Data Fetching - Aggregate Pattern

**The Aggregate Pattern is the default and required way to fetch data in pages.**

### Quick Start

```javascript
import { getEventAggregate } from '@/aggregates/event/get-event-aggregate'

const aggregate = useMemo(() => {
  if (!client) return null
  return getEventAggregate(eventId, client)
}, [client, eventId])

useEffect(() => {
  if (!aggregate?.events) return
  return aggregate.events.subscribe((state) => {
    setEvent(state.detail)
    setLoading(state.detailLoading)
  })
}, [aggregate])
```

### Documentation

- **[Complete Guide](./docs/AGGREGATE_PATTERN_GUIDE.md)** - Full documentation
- **[Quick Reference](./docs/AGGREGATE_PATTERN_QUICK_REFERENCE.md)** - 5-minute cheat sheet
- **[Template](./docs/templates/PageWithAggregate.jsx)** - Copy-paste template
- **[Main Guide](./README_AGGREGATE_PATTERN.md)** - Overview and links

## Authentication

The app implements a complete authentication flow:

- Login page (`/login`)
- Protected routes (`/events`)
- Session management with cookies
- User information display

### API Endpoints

The auth system uses the following RPC endpoints:

- `auth/signin` - Login with email and password
- `auth/me` - Get current user session data
- `auth/logout` - Logout and clear session

**Note:** All non-auth calls use WebSocket transport via aggregates.

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── lib/
│   ├── config.js     # API configuration
│   └── utils.js      # Utility functions
├── pages/
│   ├── Login.jsx
│   └── Dashboard.jsx
└── App.jsx
```

## Adding shadcn Components

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```
