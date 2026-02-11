# Data Dictionary Frontend (data-dict-frontend)

## Overview

This is a Vue 3 + TypeScript single-page application for managing and searching a data dictionary of standard fields and word roots. It provides a public search portal and an admin console (field management, root management, user and task management).

## Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Element Plus (UI)
- Pinia (state)
- Vue Router
- Axios (HTTP)
- xlsx (export)

## Project layout

- `src/main.ts` — app entry, registers router, Element Plus and Pinia.
- `src/router/index.ts` — route definitions and global guards (title, auth/role checks).
- `src/api/index.ts` — axios client, request/response interceptors and `dictionaryApi` wrappers.
- `src/store/` — Pinia stores (example: `task.ts`).
- `src/views/` — page views (e.g. `UserSearch.vue`, `StandardFieldList.vue`, `WordRootList.vue`, `TaskManagement.vue`, `UserManagement.vue`).
- `src/layouts/` — layout components (e.g. `AdminLayout.vue`).
- `src/components/` — reusable components (e.g. `TaskAnalyzer.vue`).
- `src/utils/logger.ts` — lightweight logger.
- `src/types/` — shared TypeScript types.

Key files:

- Router: [src/router/index.ts](src/router/index.ts)
- API client: [src/api/index.ts](src/api/index.ts)
- App entry: [src/main.ts](src/main.ts)
- Sample view (fields): [src/views/StandardFieldList.vue](src/views/StandardFieldList.vue)
- Store sample: [src/store/task.ts](src/store/task.ts)
- Logger: [src/utils/logger.ts](src/utils/logger.ts)

## Core logic summary

1. API client (`src/api/index.ts`)
   - Creates an `axios` instance with `baseURL` set to `/api` for Vite proxy.
   - Request interceptor injects `Authorization: Bearer <token>` from `localStorage` and logs requests.
   - Response interceptor handles errors globally; on `401`/`403` it clears local storage and redirects to login.
   - Exposes `dictionaryApi` object with methods for auth, public search, admin CRUD, suggestions, batch actions and tasks.

2. Routes & auth (`src/router/index.ts`)
   - Public routes and `/admin` nested routes (fields, roots, tasks, users).
   - Global guard sets page title, enforces login and `admin` role, and redirects as needed.

3. Store (example: `src/store/task.ts`)
   - `useTaskStore` stores `unprocessedCount` and provides `refreshCount()` which calls `dictionaryApi.getTaskCount()`.

4. Field management page (`src/views/StandardFieldList.vue`)
   - `fetchFields()` — loads paginated fields from `dictionaryApi.getFields()`.
   - `handleSearch()` — debounced search (400ms) to refresh list.
   - `handleAnalyze()` — debounced (400ms) smart-suggest call to `dictionaryApi.getSuggest()`; builds segment matrix and candidates.
   - `selectRoot(index, root)` — choose a candidate root for a segment and `syncToForm()` to update `form.field_en_name` and `composition_ids`.
   - `previewParts` and `isSelectionComplete` — preview computed English name and validate selection completeness.
   - CRUD: `submitForm()` calls `createField` or `updateField`; `handleDelete()` calls `deleteField()`; both refresh list.
   - `handleExport()` — uses `xlsx` to export fields to Excel.
   - `handleClearAll()` — high-risk confirm then `clearAllFields()`.

5. Logger (`src/utils/logger.ts`)
   - Simple level-based console logger; uses `import.meta.env.DEV` to set level.

## API endpoints (client wrappers)

The frontend wraps backend endpoints via `dictionaryApi` (see `src/api/index.ts`). Principal methods:

- Auth
  - `login(data)` -> POST `/auth/login`
  - `signup(data)` -> POST `/auth/signup`

- Public
  - `searchField(q)` -> GET `/public/search?q=...`
  - `getSimilarRoots(q)` -> GET `/public/similar-roots?q=...`

- Admin (requires auth token & admin role)
  - Roots
    - `getRoots(page,pageSize,q)` -> GET `/admin/roots?page=..&page_size=..&q=..`
    - `createRoot(data)` -> POST `/admin/roots`
    - `updateRoot(id,data)` -> PUT `/admin/roots/:id`
    - `deleteRoot(id)` -> DELETE `/admin/roots/:id`
    - `batchCreateRoots(items)` -> POST `/admin/roots/batch`
    - `clearAllRoots()` -> DELETE `/admin/roots/clear`
  - Fields
    - `getFields(page,pageSize,q)` -> GET `/admin/fields?page=..&page_size=..&q=..`
    - `createField(data)` -> POST `/admin/fields`
    - `updateField(id,data)` -> PUT `/admin/fields/:id`
    - `deleteField(id)` -> DELETE `/admin/fields/:id`
    - `getFieldDetails(id)` -> GET `/admin/fields/:id`
    - `clearAllFields()` -> DELETE `/admin/fields/clear`
  - Suggest
    - `getSuggest(q)` -> GET `/admin/suggest?q=...`
  - Users
    - `getUsers()` -> GET `/admin/users`
    - `updateUserRole(id, role)` -> PUT `/admin/users/:id`
    - `deleteUser(id)` -> DELETE `/admin/users/:id`
    - `adminCreateUser(data)` -> POST `/admin/users`
  - Tasks
    - `getTasks()` -> GET `/admin/tasks`
    - `completeTask(id)` -> PUT `/admin/tasks/:id`
    - `getTaskCount()` -> GET `/admin/tasks/count`

### Example (axios)

```ts
// login
const { data } = await dictionaryApi.login({ username: 'admin', password: 'pwd' });
localStorage.setItem('token', data.token);

// fetch fields
const res = await dictionaryApi.getFields(1, 20, '客户');
console.log(res.data.items, res.data.total);
```

### Example (curl)

```bash
curl -X POST http://localhost:5173/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"pwd"}'
```

> Note: In development the frontend sends requests to `/api/*` and relies on a Vite dev-server proxy to forward to the backend.

## Vite proxy example

Add a proxy rule in `vite.config.ts` (development) to forward `/api` to your backend, for example:

```ts
// vite.config.ts (snippet)
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  }
});
```

## Run locally

```bash
npm install
npm run dev
```

