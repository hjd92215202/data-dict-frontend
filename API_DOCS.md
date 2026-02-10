# API Reference — Data Dictionary Frontend

This document describes backend API endpoints used by the frontend client (`dictionaryApi` in `src/api/index.ts`). All endpoints are prefixed with `/api` by the frontend and in development are proxied by Vite to the backend.

Authentication
- Header: `Authorization: Bearer <token>` for admin endpoints.

Contents
- Auth
- Public
- Admin: Roots
- Admin: Fields
- Admin: Users
- Admin: Tasks

---

## Auth

### POST /api/auth/login
- Request body (application/json):

```json
{ "username": "admin", "password": "pwd" }
```

- Response (200):

```json
{ "token": "eyJ...", "role": "admin" }
```

### POST /api/auth/signup
- Request body: same as login.
- Response: typically 201 or 200 with created user info or message.

---

## Public

### GET /api/public/search?q={q}
- Query: `q` — search string
- Response (200): array of `StandardField` items.

Example response:

```json
{
  "items": [
    {
      "id": 1,
      "field_cn_name": "客户支付状态",
      "field_en_name": "customer_payment_status",
      "composition_ids": [10, 11],
      "data_type": "VARCHAR(50)",
      "associated_terms": "支付 状态",
      "is_standard": true,
      "created_at": "2026-02-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/public/similar-roots?q={q}
- Returns an array of similar roots with similarity score.

Example response:

```json
[
  { "id": 10, "cn_name": "支付", "en_abbr": "pay", "score": 0.92 }
]
```

---

## Admin (requires Authorization)

All admin endpoints return JSON; many use a paginated response shape `{ items: [...], total: n }`.

### Roots

GET /api/admin/roots?page={page}&page_size={pageSize}&q={q}
- Params: `page` (number), `page_size` (number), optional `q` (string)
- Response: `PaginatedResponse<WordRoot>`

Example WordRoot:

```json
{
  "id": 10,
  "cn_name": "支付",
  "en_abbr": "pay",
  "associated_terms": "付款 支付",
  "remark": "常用动词",
  "created_at": "2026-02-09T09:00:00Z",
  "score": 0.98
}
```

POST /api/admin/roots
- Body: `WordRoot` (cn_name, en_abbr, ...)
- Response: created resource or message.

PUT /api/admin/roots/{id}
- Body: `WordRoot` (partial or full)

DELETE /api/admin/roots/{id}

POST /api/admin/roots/batch
- Body: `{ "items": WordRoot[] }`

DELETE /api/admin/roots/clear
- Clears all roots (high-risk).

### Suggest

GET /api/admin/suggest?q={q}
- Returns `SuggestResponse`:

```json
{
  "segments": [
    {
      "word": "客户",
      "candidates": [ { /* WordRoot */ } ]
    },
    {
      "word": "支付",
      "candidates": [ { /* WordRoot */ } ]
    }
  ]
}
```

### Fields

GET /api/admin/fields?page={page}&page_size={pageSize}&q={q}
- Response: `PaginatedResponse<StandardField>`

POST /api/admin/fields
- Body: `StandardField`-like object. Example:

```json
{
  "field_cn_name": "客户支付状态",
  "field_en_name": "customer_payment_status",
  "composition_ids": [10, 11],
  "data_type": "VARCHAR(50)",
  "associated_terms": "支付 状态"
}
```

PUT /api/admin/fields/{id}
- Body: same as create.

DELETE /api/admin/fields/{id}

GET /api/admin/fields/{id}
- Returns array of `WordRoot` representing the composition details for the field.

DELETE /api/admin/fields/clear
- Clears all fields (high-risk).

### Users

GET /api/admin/users
- Returns array of users (shape depends on backend).

PUT /api/admin/users/{id}
- Body example to change role:

```json
{ "role": "admin" }
```

DELETE /api/admin/users/{id}

POST /api/admin/users
- Body: new user data (depends on backend implementation).

### Tasks

GET /api/admin/tasks
- Returns array of tasks.

PUT /api/admin/tasks/{id}
- Mark a task complete.

GET /api/admin/tasks/count
- Returns `{ "count": number }` used by store for unprocessed badge.

Example response:

```json
{ "count": 5 }
```

---

## Notes & client behaviour

- The frontend `axios` instance injects `Authorization` header from `localStorage.token` automatically.
- On 401/403 responses the client will clear `localStorage`, redirect to `/login`, and show an error message.
- Use the Vite proxy (see `vite.config.ts`) to forward `/api` to your backend in development.
