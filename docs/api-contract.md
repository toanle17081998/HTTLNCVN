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

## Homepage API

### Purpose

API aggregate cho homepage, tra ve du lieu tong hop de frontend render trong 1 request:

- bai viet moi
- su kien sap dien ra
- khoa hoc noi bat

### Endpoint

`GET /api/homepage`

### Auth

- Public endpoint
- Khong yeu cau access token

### Query Params

| Param | Type | Default | Notes |
|---|---|---|---|
| `latest_posts_limit` | integer | `6` | min `1`, max `12` |
| `featured_courses_limit` | integer | `6` | min `1`, max `12` |
| `upcoming_events_limit` | integer | `4` | min `1`, max `12` |
| `include` | string | empty | comma-separated, ho tro `posts,courses,events` |

Neu khong truyen `include`, backend tra ve day du 3 block.

### Success Response

```json
{
  "success": true,
  "data": {
    "hero": {
      "headline": "Hoc, ket noi va tang truong cung HTNC",
      "subheadline": "Noi dung moi, su kien sap toi va khoa hoc duoc de xuat cho cong dong",
      "cta": {
        "label": "Kham pha ngay",
        "href": "/courses"
      }
    },
    "latest_posts": [
      {
        "id": "3b1d8a54-7af0-4dcb-b36a-31a897b5b9ce",
        "slug": "song-hy-vong-moi-ngay",
        "title": "Song hy vong moi ngay",
        "excerpt": "Tom tat ngan cho card homepage.",
        "cover_image_url": "https://cdn.example.com/posts/song-hy-vong.jpg",
        "published_at": "2026-04-20T00:15:00Z",
        "author": {
          "id": "5315df5c-f54c-4297-bc06-b35796b0f22f",
          "name": "HTNC Editorial"
        }
      }
    ],
    "featured_courses": [
      {
        "id": "af40a4a0-70aa-4568-b83d-f91564a20e0d",
        "slug": "foundations-of-faith",
        "title": "Foundations Of Faith",
        "summary": "Khoa hoc nen tang cho nguoi moi.",
        "cover_image_url": "https://cdn.example.com/courses/foundations.jpg",
        "level": "beginner",
        "estimated_duration_minutes": 180,
        "lesson_count": 12,
        "instructor": {
          "id": "02cd19a6-3f81-4618-a8fb-e16d0c6d179b",
          "name": "Muc su An"
        }
      }
    ],
    "upcoming_events": [
      {
        "id": "bf31446d-d0f9-4db8-bccf-4012b6d05731",
        "slug": "worship-night-apr-2026",
        "title": "Worship Night April 2026",
        "excerpt": "Dem nhom va tho phuong hang thang.",
        "starts_at": "2026-04-28T12:00:00Z",
        "ends_at": "2026-04-28T14:00:00Z",
        "location_name": "HTNC Main Hall",
        "cover_image_url": "https://cdn.example.com/events/worship-night.jpg"
      }
    ]
  },
  "meta": {
    "generated_at": "2026-04-20T01:00:00Z",
    "included": [
      "posts",
      "courses",
      "events"
    ]
  }
}
```

### Selection Rules

#### `latest_posts`

- Lay tu `posts`
- Chi lay ban ghi `status = 'published'`
- `deleted_at IS NULL`
- Sap xep `published_at DESC`

#### `featured_courses`

- Lay tu `courses`
- Chi lay ban ghi `status = 'published'`
- `visibility = 'public'`
- `deleted_at IS NULL`
- Sap xep uu tien:
  1. course duoc gan featured flag khi co o v2
  2. tam thoi v1 sap xep `published_at DESC`
- `lesson_count` tinh tu `lessons` voi `status = 'published'`

#### `upcoming_events`

- Lay tu `events`
- Chi lay ban ghi `status = 'published'`
- `visibility = 'public'`
- `deleted_at IS NULL`
- `starts_at >= now()`
- Sap xep `starts_at ASC`

### Source Mapping

| Block | Primary source | Status in repo |
|---|---|---|
| `latest_posts` | `posts`, `users` | supported by DB v1 |
| `featured_courses` | `courses`, `lessons`, `users` | supported by DB v1 |
| `upcoming_events` | `events` | supported by migration `20260420_000002_events_homepage_v1` |

### Cache Strategy

- Public aggregate endpoint nen cache o app layer hoac CDN
- TTL de xuat: `300` giay
- Cache key de xuat: `homepage:{locale}:{include}:{limits}`
- SQL draft cho aggregate: `apps/api/database/queries/homepage-aggregate.sql`

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
