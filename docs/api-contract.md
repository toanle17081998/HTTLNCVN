# API Contract

## Conventions

- Base path: `/api`
- Response format uu tien `success + data + meta`
- Public API khong yeu cau auth se van giu format thong nhat
- Date/time dung ISO 8601 UTC string
- `id` dung `UUID`

## Response Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

## Page Builder API

### Purpose

API cho public pages duoc quan ly bang page builder.

### Endpoints

- `GET /api/pages/resolve?path=/`
- `GET /api/pages`
- `GET /api/pages/:slug`
- `POST /api/pages`
- `PATCH /api/pages/:slug`
- `DELETE /api/pages/:slug`

### Auth

- `GET /api/pages/resolve` la public endpoint
- cac endpoint con lai yeu cau access token

### Resolve Success Response

```json
{
  "success": true,
  "data": {
    "id": "c8005633-2ebb-4d91-b9f3-464e5c164c31",
    "slug": "home",
    "route_path": "/",
    "title_en": "Home",
    "title_vi": "Home",
    "status": "published",
    "content": "{\"ROOT\":{...}}",
    "created_at": "2026-04-23T08:55:43.533Z",
    "updated_at": "2026-04-23T15:59:37.474Z"
  },
  "meta": {}
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter: latest_posts_limit"
  }
}
```

## Implementation Notes

- Trong `apps/api`, endpoint nay nen nam o `modules/page` hoac `modules/homepage`.
- Khong nen de frontend goi 3 endpoint rieng cho hero/posts/courses/events trong first paint neu day la homepage public.
- Query draft da co san o `apps/api/database/queries/homepage-aggregate.sql`.
- Cache app-layer hien tai co TTL mac dinh `300` giay.
