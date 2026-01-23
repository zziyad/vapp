# VAPP - React + Vite + shadcn/ui

A modern React application with authentication and user session management.

## Features

- ⚡ React 18 + Vite for fast development
- 🎨 shadcn/ui components with Tailwind CSS
- 🔐 Authentication system with session management
- 🛣️ React Router for navigation
- 📱 Responsive design

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

## Authentication

The app implements a complete authentication flow:

- Login page (`/login`)
- Protected dashboard (`/dashboard`)
- Session management with cookies
- User information display

### API Endpoints

The auth system uses the following RPC endpoints:

- `auth/signin` - Login with email and password
- `auth/me` - Get current user session data
- `auth/logout` - Logout and clear session

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
