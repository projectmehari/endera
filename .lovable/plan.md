

## Toggle PWA Service Worker On/Off from Admin

### Problem
The PWA service worker caching is causing performance issues. You want an admin toggle to enable/disable it, defaulted to **off**.

### Approach

1. **Add a `pwa_enabled` column to `station_config`**
   - New boolean column, default `false` (off for now)
   - Migration: `ALTER TABLE station_config ADD COLUMN pwa_enabled boolean NOT NULL DEFAULT false;`

2. **Add an admin edge function to update this setting**
   - Extend the existing `admin-update-track` function or create a small `admin-update-config` edge function that accepts `{ token, pwaEnabled }` and updates the `station_config` row.

3. **Add a toggle switch in the Admin panel**
   - In the header area of `TrackManager`, add a labeled Switch component (already available via `@radix-ui/react-switch`)
   - On mount, fetch `station_config.pwa_enabled` and set the switch state
   - On toggle, call the edge function to persist the change

4. **Conditionally register/unregister the service worker on the frontend**
   - In `src/main.tsx` (or `App.tsx`), fetch `station_config.pwa_enabled` on app load
   - If **disabled**: unregister any existing service worker (`navigator.serviceWorker.getRegistrations()` then `.unregister()`)
   - If **enabled**: let the VitePWA auto-registration proceed as normal
   - The PWA plugin's `registerType: "autoUpdate"` auto-registers a SW; we'll override this by adding manual control: set `registerType: "prompt"` or handle registration ourselves based on the DB flag

### Technical Details

**Database migration:**
```sql
ALTER TABLE station_config ADD COLUMN pwa_enabled boolean NOT NULL DEFAULT false;
```

**Edge function `admin-update-config/index.ts`:**
- Validates admin token
- Accepts `{ token, pwaEnabled: boolean }`
- Updates `station_config` table

**`src/main.tsx` changes:**
- Import supabase client
- Before rendering, query `station_config` for `pwa_enabled`
- If false, unregister all service workers and delete caches
- If true, import and call `registerSW` from `virtual:pwa-register`

**`vite.config.ts` changes:**
- Switch `registerType` from `"autoUpdate"` to `"manual"` so the app controls when/if the SW registers

**`src/pages/Admin.tsx` changes:**
- Add a "PWA / OFFLINE MODE" toggle in the header panel using the Switch component
- Fetch current state from `station_config` on mount
- Call `admin-update-config` on toggle

