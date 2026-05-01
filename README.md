# FileForge Developer Console

A web-based developer portal for the [FileForge](https://fileforge1.pythonanywhere.com) file storage service. Developers use this console to manage their account, create Apps, generate API keys, and read the Storage API documentation.

---

## What it does

| Page | Purpose |
|---|---|
| **Dashboard** | Overview of your Apps and account activity |
| **Apps** | Create and manage Apps; each App owns its files and credentials |
| **App Detail** | View an App's API keys, generate new ones, revoke existing ones |
| **App Settings** | Update an App's name, description, or status |
| **Docs** | Storage API reference — endpoints, request/response examples, status codes |
| **Profile** | Update your name or change your password |

All management operations (account, Apps, API keys) happen through this UI. Developers interact with the **Storage API** (`/api/`) directly from their own backend code using the API keys generated here.

---

## Tech stack

- **Framework**: React 19 + TypeScript
- **Build tool**: Vite 6
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix UI primitives)
- **Routing**: wouter
- **Data fetching**: TanStack React Query
- **Forms**: react-hook-form + zod
- **Icons**: lucide-react

---

## Backend

The console talks to a Python backend hosted at:

```
https://fileforge1.pythonanywhere.com
```

To point the console at a different backend (e.g. a local dev server), set the environment variable:

```
VITE_API_BASE_URL=http://localhost:8000
```

### Authentication flow

The console uses **JWT tokens** (stored in `localStorage` as `ff_access` and `ff_refresh`). Access tokens are short-lived (30 min); the API client automatically refreshes them using the refresh token when a `401` is received. If the refresh also fails, the user is logged out.

---

## Development

**Install dependencies**

```bash
npm install
```

**Start the dev server** (runs on port 5000)

```bash
npm run dev
```

**Build for production**

```bash
npm run build
```

Output is written to `dist/`.

---

## Deployment

The app is a fully static SPA — build it and serve the `dist/` folder from any static host. All routes must fall back to `index.html` (rewrites are already configured in `firebase.json` if deploying to Firebase Hosting).
