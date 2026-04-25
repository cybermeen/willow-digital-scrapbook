# Backend API Documentation

This document describes the backend API for Willow.


## Authentication

All auth endpoints are under `/api/auth`.

### Register a new user

- URL: `POST /api/auth/register`
- Body:
  - `email` (string, required)
  - `password` (string, required)
  - `displayName` (string, optional)
- Response: `201 Created`

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securePassword",
  "displayName": "Jane Doe"
}
```

Example response:

```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "display_name": "Jane Doe",
    "is_first_login": true
  }
}
```

### Log in

- URL: `POST /api/auth/login`
- Body:
  - `email` (string, required)
  - `password` (string, required)
- Response: `200 OK`

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securePassword"
}
```

Example response:

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "Jane Doe",
    "isFirstLogin": true
  }
}
```

### Log out

- URL: `POST /api/auth/logout`
- Response: `200 OK`

Example response:

```json
{
  "message": "Logged out successfully"
}
```

## Scrapbook API

All `/api/scrapbook` routes require authentication. The route file applies auth middleware globally.

### Logs

#### Get or create a log for a specific date

- URL: `GET /api/scrapbook/logs/:date`
- Params:
  - `date` (string, required) — typically `YYYY-MM-DD`
- Response: `200 OK`

#### Get all past logs

- URL: `GET /api/scrapbook/logs`
- Response: `200 OK`

#### Update a log

- URL: `PATCH /api/scrapbook/logs/:logId`
- Params:
  - `logId` (integer, required)
- Body: JSON object with updated log fields such as mood, layout, title, or settings.

### Photos

#### Upload a photo

- URL: `POST /api/scrapbook/photos/:logId`
- Params:
  - `logId` (integer, required)
- Body: multipart form data with a file field named `photo`
- Accepted file types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Max file size: 10 MB

Example curl:

```bash
curl -X POST http://localhost:3000/api/scrapbook/photos/123 \
  -F "photo=@/path/to/photo.jpg"
```

#### Update photo metadata

- URL: `PATCH /api/scrapbook/photos/:photoId`
- Params:
  - `photoId` (integer, required)
- Body: JSON object containing updated metadata such as caption, position, or ordering.

#### Delete a photo

- URL: `DELETE /api/scrapbook/photos/:photoId`
- Params:
  - `photoId` (integer, required)

### Notes

#### Create a note

- URL: `POST /api/scrapbook/notes/:logId`
- Params:
  - `logId` (integer, required)
- Body: JSON object containing note content and metadata.

#### Update a note

- URL: `PATCH /api/scrapbook/notes/:noteId`
- Params:
  - `noteId` (integer, required)
- Body: JSON object with updated note content.

#### Delete a note

- URL: `DELETE /api/scrapbook/notes/:noteId`
- Params:
  - `noteId` (integer, required)

### Prompts

#### Get today’s random prompt

- URL: `GET /api/scrapbook/prompts/daily`
- Response: `200 OK`

#### Save a prompt answer

- URL: `POST /api/scrapbook/prompts/answer/:logId`
- Params:
  - `logId` (integer, required)
- Body: JSON object containing the prompt answer text and metadata.

#### Update a prompt answer

- URL: `PATCH /api/scrapbook/prompts/answer/:answerId`
- Params:
  - `answerId` (integer, required)
- Body: JSON object with updated answer text.

### Stickers

#### List available art assets

- URL: `GET /api/scrapbook/assets`
- Response: `200 OK`

#### Place a sticker

- URL: `POST /api/scrapbook/stickers/:logId`
- Params:
  - `logId` (integer, required)
- Body: JSON object with sticker ID, position, and related metadata.

#### Update a sticker

- URL: `PATCH /api/scrapbook/stickers/:stickerId`
- Params:
  - `stickerId` (integer, required)
- Body: JSON object containing updated position or size.

#### Remove a sticker

- URL: `DELETE /api/scrapbook/stickers/:stickerId`
- Params:
  - `stickerId` (integer, required)

### Layout and achievements

#### Save an entire layout

- URL: `POST /api/scrapbook/layout/:logId`
- Params:
  - `logId` (integer, required)
- Body: JSON object representing the full layout data.

#### Unlock an achievement

- URL: `POST /api/scrapbook/logs/:logId/unlock-achievement`
- Params:
  - `logId` (integer, required)
- Body: JSON object containing achievement metadata.

## Todo API

### Get tasks for a user

- URL: `GET /api/todo/:userId`
- Params:
  - `userId` (integer, required)
- Response: categorized tasks grouped into:
  - `today`
  - `thisWeek`
  - `upcoming`
  - `completed`

### Create a task

- URL: `POST /api/todo`
- Body:
  - `user_id` (integer, required)
  - `title` (string, required)
  - `due_date` (string or ISO date, optional)
  - `priority` (string, optional)

Example request body:

```json
{
  "user_id": 1,
  "title": "Finish project README",
  "due_date": "2026-04-10T12:00:00Z",
  "priority": "High"
}
```

### Toggle completion status

- URL: `PATCH /api/todo/:id/toggle`
- Params:
  - `id` (integer, required)
- Body:
  - `user_id` (integer, required)

### Delete a task

- URL: `DELETE /api/todo/:id`
- Params:
  - `id` (integer, required)
- Body:
  - `user_id` (integer, required)
