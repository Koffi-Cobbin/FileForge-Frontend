# FileForge Developer Portal — Next.js Frontend Build Prompt

## Project Overview

You are building a **developer portal** frontend for **FileForge**, a pluggable cloud storage bridge REST API. FileForge allows developers to register apps, generate API keys, and route file uploads to cloud storage providers (Google Drive, Cloudinary) through a unified API.

The portal has two distinct surfaces:
1. **Control Plane** — JWT-authenticated dashboard for managing developer accounts, apps, and API keys.
2. **Storage API** — API-key-authenticated endpoints (developers integrate these into their own apps; the portal only demonstrates/documents them, it does NOT call them with the developer's browser session).

---

## Base URL

```
http://localhost:5000
```

All auth management routes are under `/auth/`, all storage API routes under `/api/`.

---

## Authentication Architecture

### Two separate auth mechanisms

| Surface | Mechanism | Who uses it |
|---|---|---|
| Developer Portal (`/auth/`) | JWT Bearer token | Human developer in the browser |
| Storage API (`/api/`) | API Key (`ffk_...` prefix) | External backend servers |

**The frontend only ever authenticates with JWT.** API keys are generated in the portal and handed to the developer to use in their own servers — the portal never makes `/api/` calls on behalf of the user (except optionally for demonstrations).

### JWT Token Flow

1. `POST /auth/token/` with `{ email, password }` → returns `{ access, refresh, email, full_name }`
2. Store `access` token in memory (or `httpOnly` cookie if using middleware). Store `refresh` in `localStorage` or a secure cookie.
3. Attach to every authenticated request: `Authorization: Bearer <access_token>`
4. Access token lifetime: 30 minutes. Refresh token lifetime: 7 days.
5. Refresh via `POST /auth/token/refresh/` with `{ refresh }` → returns new `{ access, refresh }`.
6. `ROTATE_REFRESH_TOKENS: true` — every refresh call invalidates the old refresh token and issues a new one.
7. On logout, blacklist the refresh token (SimpleJWT handles this server-side when token blacklisting is enabled).

---

## Full API Reference

### 1. Developer Registration

```
POST /auth/register/
```

**No auth required.**

Request body:
```json
{
  "email": "dev@example.com",
  "full_name": "Ada Lovelace",
  "password": "StrongPass123!",
  "password_confirm": "StrongPass123!"
}
```

Success `201`:
```json
{
  "id": 1,
  "email": "dev@example.com",
  "full_name": "Ada Lovelace",
  "date_joined": "2026-04-28T10:00:00Z"
}
```

Errors `400`:
```json
{
  "password_confirm": ["Passwords do not match."],
  "password": ["This password is too common."]
}
```

Duplicate email also returns `400`.

---

### 2. Obtain JWT Tokens (Login)

```
POST /auth/token/
```

**No auth required.**

Request body:
```json
{
  "email": "dev@example.com",
  "password": "StrongPass123!"
}
```

Success `200`:
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "email": "dev@example.com",
  "full_name": "Ada Lovelace"
}
```

Error `401`: invalid credentials.

---

### 3. Refresh Access Token

```
POST /auth/token/refresh/
```

**No auth required** (the refresh token IS the credential).

Request body:
```json
{
  "refresh": "<jwt_refresh_token>"
}
```

Success `200`:
```json
{
  "access": "<new_jwt_access_token>",
  "refresh": "<new_jwt_refresh_token>"
}
```

Error `401`: expired or blacklisted refresh token → redirect to login.

---

### 4. Get / Update Developer Profile

```
GET  /auth/me/
PATCH /auth/me/
```

**Requires JWT.**

`PATCH` body (all fields optional):
```json
{
  "full_name": "Updated Name"
}
```

Response (both):
```json
{
  "id": 1,
  "email": "dev@example.com",
  "full_name": "Ada Lovelace",
  "date_joined": "2026-04-28T10:00:00Z"
}
```

Note: `email` is read-only; cannot be changed via this endpoint.

---

### 5. Change Password

```
POST /auth/me/change-password/
```

**Requires JWT.**

Request body:
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

Success `200`:
```json
{ "detail": "Password updated." }
```

Error `400`:
```json
{ "current_password": ["Incorrect password."] }
```

---

### 6. List Apps

```
GET /auth/apps/
```

**Requires JWT.** Returns only apps belonging to the authenticated developer.

Response `200`:
```json
[
  {
    "id": 1,
    "name": "My Production App",
    "description": "Main customer-facing integration",
    "owner_slug": "app_xyz123abcdef",
    "is_active": true,
    "api_key_count": 2,
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-01T10:00:00Z"
  }
]
```

Key fields:
- `owner_slug` — stable identifier used in all storage API calls. Never changes. Display prominently.
- `api_key_count` — count of currently active keys.

---

### 7. Create App

```
POST /auth/apps/
```

**Requires JWT.**

Request body:
```json
{
  "name": "My App",
  "description": "Optional description"
}
```

Success `201`: returns full App object (same shape as list item).

Error `400`: duplicate name for the same developer.

---

### 8. Get App Detail

```
GET /auth/apps/{id}/
```

**Requires JWT.**

Returns single App object. `404` if not owned by the authenticated developer.

---

### 9. Update App

```
PATCH /auth/apps/{id}/
```

**Requires JWT.**

Patchable fields:
```json
{
  "name": "Renamed App",
  "description": "New description",
  "is_active": false
}
```

`owner_slug` is **immutable** — any attempt to change it is silently ignored by the server.

---

### 10. Delete App

```
DELETE /auth/apps/{id}/
```

**Requires JWT.**

Returns `204 No Content`. Cascades — deletes all API keys for that app.

---

### 11. List API Keys for an App

```
GET /auth/apps/{app_id}/keys/
```

**Requires JWT.**

Response `200`:
```json
[
  {
    "id": 1,
    "app": 1,
    "app_name": "My Production App",
    "name": "production server",
    "key_prefix": "ffk_abcd",
    "is_active": true,
    "last_used_at": "2026-04-27T14:30:00Z",
    "expires_at": null,
    "created_at": "2026-04-01T10:00:00Z"
  }
]
```

**Critical**: `raw_key` is NEVER included in list responses. Only the first 8 characters (`key_prefix`) are shown — this is safe to display as a hint.

---

### 12. Create API Key

```
POST /auth/apps/{app_id}/keys/
```

**Requires JWT.**

Request body:
```json
{
  "name": "production server",
  "expires_at": "2027-01-01T00:00:00Z"  // optional, null = never expires
}
```

Success `201`:
```json
{
  "id": 2,
  "name": "production server",
  "key_prefix": "ffk_abcd",
  "raw_key": "ffk_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab",
  "expires_at": null,
  "created_at": "2026-04-28T10:00:00Z"
}
```

**CRITICAL UX requirement**: `raw_key` is shown **exactly once** — the server never stores it in plaintext and will never return it again. You MUST show it in a modal/alert with a "Copy to clipboard" button and a warning: *"Save this key now — it will not be shown again."* Force the user to acknowledge before dismissing.

---

### 13. Revoke API Key

```
POST /auth/apps/{app_id}/keys/{key_id}/revoke/
```

**Requires JWT.**

No request body.

Success `200`:
```json
{ "detail": "API key revoked." }
```

This sets `is_active = false`. It does NOT delete the key record. Show revoked keys differently in the UI (greyed out, strikethrough, or hidden behind a toggle).

---

### 14. Health Check (Public)

```
GET /api/health/
```

**No auth required.**

```json
{
  "status": "ok",
  "providers": ["cloudinary", "google_drive"]
}
```

Use this on the dashboard to show system status and available providers.

---

## Storage API Reference (for Documentation/Demo UI only)

The following endpoints are for **developer reference** — display them as documentation within the portal so developers know how to integrate FileForge into their own backends. The portal itself does not call these with JWT; they require an API key (`Authorization: Bearer ffk_...`).

### Provider List

```
GET /api/providers/
Authorization: Bearer ffk_...
```

```json
{
  "providers": [
    { "name": "cloudinary", "supports_direct_upload": true },
    { "name": "google_drive", "supports_direct_upload": true }
  ]
}
```

### Credentials CRUD

```
GET    /api/credentials/
POST   /api/credentials/
GET    /api/credentials/{id}/
PATCH  /api/credentials/{id}/
DELETE /api/credentials/{id}/
Authorization: Bearer ffk_...
```

POST body:
```json
{
  "provider": "cloudinary",
  "credentials": {
    "cloud_name": "my-cloud",
    "api_key": "123456789",
    "api_secret": "secret"
  },
  "is_default": true
}
```

### File Upload (Async, ≤5 MB by default)

```
POST /api/files/
Authorization: Bearer ffk_...
Content-Type: multipart/form-data

file=<binary>
provider=cloudinary
name=my-file.pdf  (optional)
```

Returns `202 Accepted` with `status: "pending"`. Poll `GET /api/files/{id}/` until `status` is `"completed"` or `"failed"`.

### Direct Upload (Large Files)

Step 1 — init:
```
POST /api/files/direct-upload/
Authorization: Bearer ffk_...
Content-Type: application/json

{
  "name": "large-video.mp4",
  "provider": "cloudinary",
  "size": 52428800,
  "content_type": "video/mp4"
}
```

Returns:
```json
{
  "file_id": 44,
  "upload_url": "https://api.cloudinary.com/...",
  "method": "POST",
  "fields": { "timestamp": "...", "api_key": "...", "signature": "..." },
  "headers": {},
  "expires_in": null,
  "provider_ref": { "public_id": "large-video", "resource_type": "video" }
}
```

Step 2 — client uploads directly to `upload_url` using `method` and `fields`.

Step 3 — complete:
```
POST /api/files/direct-upload/complete/
Authorization: Bearer ffk_...

{
  "file_id": 44,
  "provider_file_id": "large-video",
  "url": "https://res.cloudinary.com/.../large-video.mp4",
  "provider_response": { ... }
}
```

### File CRUD

```
GET    /api/files/              // list, filter by ?provider=cloudinary
GET    /api/files/{id}/
PATCH  /api/files/{id}/         // body: { "name": "new-name.pdf" }
DELETE /api/files/{id}/
Authorization: Bearer ffk_...
```

---

## Error Response Format

DRF returns errors consistently:

```json
// Field-level validation errors
{
  "field_name": ["Error message."]
}

// Non-field errors
{
  "detail": "Error message."
}

// Multiple field errors
{
  "email": ["This field is required."],
  "password": ["This password is too short."]
}
```

HTTP status codes used:
- `200` OK, `201` Created, `202` Accepted, `204` No Content
- `400` Bad Request (validation)
- `401` Unauthorized (invalid/expired credentials)
- `403` Forbidden (wrong auth type, e.g. API key used on JWT-only endpoint)
- `404` Not Found (or resource belongs to another developer)
- `413` Request Entity Too Large (file size)
- `502` Bad Gateway (provider error)

---

## Suggested Next.js App Structure

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx               # sidebar + auth guard
    page.tsx                 # overview / health status
    apps/
      page.tsx               # app list
      [id]/
        page.tsx             # app detail + keys
        settings/page.tsx    # rename, deactivate, delete
    profile/page.tsx         # me + change password
    docs/page.tsx            # storage API reference

lib/
  api.ts                     # typed fetch wrapper with auto-refresh
  auth.ts                    # token storage helpers
  types.ts                   # all TypeScript types

components/
  ApiKeyRevealModal.tsx       # one-time raw key display
  CopyButton.tsx
  AppCard.tsx
  KeyRow.tsx
```

---

## TypeScript Types

```typescript
interface DeveloperProfile {
  id: number;
  email: string;
  full_name: string;
  date_joined: string;
}

interface App {
  id: number;
  name: string;
  description: string;
  owner_slug: string;
  is_active: boolean;
  api_key_count: number;
  created_at: string;
  updated_at: string;
}

interface ApiKey {
  id: number;
  app: number;
  app_name: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface ApiKeyCreated extends Omit<ApiKey, 'app' | 'app_name' | 'is_active' | 'last_used_at'> {
  raw_key: string; // shown once only
}

interface TokenResponse {
  access: string;
  refresh: string;
  email: string;
  full_name: string;
}

type FileStatus = 'pending' | 'uploading' | 'completed' | 'failed';

interface StorageFile {
  id: number;
  name: string;
  size: number;
  content_type: string;
  provider: string;
  provider_file_id: string | null;
  url: string | null;
  status: FileStatus;
  error_message: string;
  owner: string;
  metadata: Record<string, unknown>;
  upload_strategy: string;
  created_at: string;
  updated_at: string;
}
```

---

## Token Refresh Logic

Implement an interceptor/wrapper around `fetch` that:

1. Attaches `Authorization: Bearer <access>` to every request.
2. On `401` response, attempts `POST /auth/token/refresh/` with stored refresh token.
3. If refresh succeeds: stores new tokens and retries the original request once.
4. If refresh fails (refresh expired/blacklisted): clears all tokens and redirects to `/login`.

```typescript
// lib/api.ts skeleton
async function apiFetch(url: string, options: RequestInit = {}) {
  const access = getAccessToken();
  const res = await fetch(BASE_URL + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch(url, options); // retry once
    } else {
      clearTokens();
      redirect('/login');
    }
  }

  return res;
}
```

---

## Key UX Requirements

### API Key One-Time Reveal
When a new key is created, display `raw_key` in a modal that:
- Shows the full key in a monospace code block
- Has a prominent "Copy" button with confirmation feedback
- Displays a red/amber warning: *"This key will not be shown again. Copy it now."*
- Requires clicking an "I've saved my key" button (not just an X) to dismiss
- Does NOT close on backdrop click

### owner_slug Display
Each app has an `owner_slug` (e.g. `app_xyz123abcdef`). Display it prominently on the app detail page — developers need this value when configuring their backend to use the Storage API.

### Key Status
API keys have three meaningful states:
- **Active** — `is_active: true`, no expiry or future expiry
- **Expiring soon** — active but `expires_at` within 7 days
- **Expired/Revoked** — `is_active: false` or `expires_at` in the past

### App Deactivation vs Deletion
`PATCH /auth/apps/{id}/` with `{ "is_active": false }` deactivates (keys stop working) without deleting records. `DELETE /auth/apps/{id}/` permanently removes. Confirm both actions.

---

## Pages Summary

| Route | Auth | Purpose |
|---|---|---|
| `/login` | Public | JWT login form |
| `/register` | Public | Developer registration |
| `/` (dashboard) | JWT | Health status, quick stats |
| `/apps` | JWT | List all apps |
| `/apps/new` | JWT | Create app form |
| `/apps/[id]` | JWT | App detail: info, owner_slug, key list |
| `/apps/[id]/settings` | JWT | Edit name/description, deactivate, delete |
| `/profile` | JWT | View/edit profile, change password |
| `/docs` | JWT | Storage API reference & code samples |

---

## CORS Notes

The backend allows all origins in DEBUG mode. In production, only specific origins are whitelisted. During development, your Next.js dev server at `http://localhost:3000` is in the whitelist. Credentials are allowed (`CORS_ALLOW_CREDENTIALS: true`), so cookie-based refresh tokens will work.

---

## Do Not Build

- Any UI that calls `/api/files/`, `/api/credentials/`, or `/api/providers/` using the developer's JWT. Those endpoints reject JWT auth. They are backend-to-backend; the portal only documents them.
- A file browser or uploader using JWT — this would fail with 403.
- Any assumption that `email` can be changed — the server ignores it on PATCH.
- Re-display of `raw_key` after the creation response — it is not stored and cannot be retrieved.