# FileForge Frontend Fixes

## Phase 1: Fix Project Configuration
- [x] Rewrite `package.json` with correct Vite SPA dependencies
- [x] Fix `vite.config.ts` with defaults for PORT/BASE_PATH
- [x] Fix `tsconfig.json` for Vite project
- [x] Create `.env` with defaults

## Phase 2: Fix Types and API Layer
- [x] Fix `src/lib/types.ts` - HealthStatus.providers to string[]
- [x] Fix `src/lib/api.ts` - consistent auth failure handling
- [x] Fix `src/hooks/use-auth.ts` - proper profile handling
- [x] Fix `src/components/auth-guard.tsx` - validate token properly

## Phase 3: Fix Pages
- [x] Fix `src/pages/dashboard.tsx` - providers array iteration
- [x] Fix `src/pages/register.tsx` - auto-login race condition
- [x] Fix `src/pages/not-found.tsx` - dark mode support
- [x] Fix `src/pages/docs.tsx` - accurate API documentation
- [x] Fix `src/pages/app-detail.tsx` - select default value
- [x] Fix `src/pages/app-settings.tsx` - deleteApp mutate call

## Phase 4: Install and Verify
- [x] Run `npm install`
- [ ] Verify dev server starts

<!-- ffk_AoMRLwITo1-2SZVDf9Sgful-AOIqc5mLljPO_10y -->