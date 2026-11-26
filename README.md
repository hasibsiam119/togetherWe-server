# TogetherWe API — Express & MongoDB Backend

![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.3.0-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.9.1-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2F%20JWKS-000000)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

TogetherWe is a community-driven social impact platform. This repository contains the Express.js REST API that powers event discovery, event management, and event participation for the TogetherWe frontend.

## Table of Contents

- [Project Overview](#project-overview)
- [Live API](#live-api)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [MongoDB Database and Collections](#mongodb-database-and-collections)
- [Authentication Middleware](#authentication-middleware)
- [Development Commands](#development-commands)
- [Deployment Instructions](#deployment-instructions)

## Project Overview

The TogetherWe API is a single Express application that provides:

- Public endpoints for browsing upcoming and featured events.
- Public event detail lookup by MongoDB ObjectId.
- Authenticated endpoints for creating, updating, and deleting events.
- Authenticated endpoints for listing events created by a specific email.
- Authenticated endpoints for joining events, listing joined events, and removing joined-event records.
- JWT verification using a remote JWKS endpoint exposed by Better Auth on the frontend.
- MongoDB Atlas persistence with connection reuse, timeouts, and indexes.
- JSON error handling for validation, authentication, database, and routing errors.

The application is designed to run locally with `app.listen()` and as a Vercel Function through its default Express export.

## Live API

| Service | URL |
| --- | --- |
| Backend API | https://together-we-server-eight.vercel.app/ |
| Frontend application | https://together-we-by-hasibsiam.vercel.app/ |

Health check:

```http
GET /
```

```json
{
  "message": "server is running fine"
}
```

## Key Features

- **Event discovery** — Upcoming events filtered by the current date in the `Asia/Dhaka` timezone and sorted by date.
- **Featured events** — A limited set of upcoming events for the homepage.
- **Event detail lookup** — Fetch a single event by MongoDB ObjectId.
- **Event management** — Create, update, and delete events with JWT authentication.
- **User event listing** — List events associated with an organizer email.
- **Event participation** — Record joined events, list joined events by email, and remove participation records.
- **JWT authentication** — Bearer token verification with `jose` against a remote JWKS endpoint.
- **ObjectId validation** — Invalid MongoDB ObjectIds return a JSON `400` response instead of throwing.
- **Centralized error handling** — JSON responses for malformed JSON, validation failures, unknown routes, authentication failures, and server errors.
- **MongoDB connection reuse** — A lazy, cached connection promise shared across requests, with retry after a failed connection.
- **Connection and pool controls** — Connection, server-selection, pool, and wait-queue timeouts are configured.
- **Index creation** — Supporting indexes are created on first connection.
- **CORS enabled** — The separately deployed frontend can call the API from the browser.
- **Serverless compatible** — `app.listen()` is skipped on Vercel; the default export is used instead.

## Technologies Used

| Category | Technology |
| --- | --- |
| Runtime | Node.js 20.19 or newer |
| Framework | Express 5.3.0 |
| Database | MongoDB Atlas with MongoDB Node.js Driver 7.9.1 |
| Authentication | JWT verification with `jose` 6.2.18 and remote JWKS |
| Middleware | `cors` 2.8.6 |
| Configuration | `dotenv` 18.0.10 |
| Module system | ECMAScript Modules (`"type": "module"`) |
| Deployment | Vercel Functions |

## Project Structure

```text
togetherwe-server/
├── index.js          # Express app, routes, MongoDB connection, JWT middleware, error handling
├── package.json
├── package-lock.json
├── .env              # Local environment variables; ignored by Git
├── .gitignore
└── README.md
```

All backend application code is contained in `index.js`.

## Installation and Setup

### Prerequisites

- Node.js 20.19 or newer
- npm
- A MongoDB Atlas cluster
- A running TogetherWe frontend that exposes the Better Auth JWKS endpoint at `/api/auth/jwks` when testing protected routes

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/hasibsiam119/togetherWe-server.git
   cd togetherWe-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add the variables described in [Environment Variables](#environment-variables).

4. Start the API:

   ```bash
   node index.js
   ```

   The local server listens on `http://localhost:8000` by default.

5. Verify the health endpoint:

   ```bash
   curl http://localhost:8000/
   ```

The `.env` file is ignored by Git. Do not commit real credentials.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URL` | Yes | MongoDB Atlas connection string. The API uses the `togetherWe` database. |
| `CLIENT_URL` | Yes for authenticated routes | Base URL of the TogetherWe frontend. The API fetches the JWKS document from `${CLIENT_URL}/api/auth/jwks` to verify JWTs. Use a public HTTPS URL in production. |
| `PORT` | No | Local HTTP port used by `app.listen()`. Defaults to `8000`. Not used when the application runs as a Vercel Function. |
| `VERCEL` | Set automatically by Vercel | Prevents `app.listen()` from running inside the serverless function. Do not configure this manually. |

### Example `.env`

```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>/togetherWe?retryWrites=true&w=majority
CLIENT_URL=http://localhost:3000
PORT=8000
```

`CLIENT_URL` must point to the frontend deployment that serves the Better Auth API. It must not contain a trailing slash or point to `localhost` in production.

## API Endpoints

### Endpoint Summary

| Method | Endpoint | Description | Authentication |
| --- | --- | --- | --- |
| `GET` | `/` | Health check | Public |
| `GET` | `/events` | List upcoming events filtered by date and sorted ascending | Public |
| `GET` | `/featured` | List up to 6 upcoming events for the homepage | Public |
| `GET` | `/events/:id` | Get a single event by ObjectId | Public |
| `GET` | `/events/user/:email` | List events associated with an organizer email | Bearer JWT |
| `POST` | `/add-event` | Create an event | Bearer JWT |
| `PATCH` | `/events/:id` | Update an event | Bearer JWT |
| `DELETE` | `/events/:id` | Delete an event | Bearer JWT |
| `POST` | `/joined` | Record a joined event | Bearer JWT |
| `GET` | `/joined/:email` | List joined-event records for an email | Bearer JWT |
| `DELETE` | `/joined/:id` | Delete a joined-event record by its `_id` | Bearer JWT |

Protected endpoints require this header:

```http
Authorization: Bearer <jwt>
```

### Health Check

#### `GET /`

Returns a simple status message.

```json
{
  "message": "server is running fine"
}
```

### Events

#### `GET /events`

Returns events whose `date` is greater than or equal to today's date in the `Asia/Dhaka` timezone. Results are sorted by `date` in ascending order.

```json
[
  {
    "_id": "665f1c2a9b1e4a0012a34567",
    "title": "Community Cleanup Drive",
    "type": "Cleanup",
    "date": "2026-12-05",
    "location": "Dhanmondi Lake, Dhaka",
    "thumbnail": "https://example.com/cleanup.jpg",
    "description": "Join volunteers to clean the lakeside area.",
    "email": "organizer@example.com"
  }
]
```

#### `GET /featured`

Returns up to 6 events using the same upcoming-date filter and date sort as `GET /events`.

```json
[
  {
    "_id": "665f1c2a9b1e4a0012a34567",
    "title": "Community Cleanup Drive",
    "type": "Cleanup",
    "date": "2026-12-05",
    "location": "Dhanmondi Lake, Dhaka",
    "thumbnail": "https://example.com/cleanup.jpg",
    "description": "Join volunteers to clean the lakeside area.",
    "email": "organizer@example.com"
  }
]
```

#### `GET /events/:id`

Returns a single event by its 24-character MongoDB ObjectId.

**Success response:**

```json
{
  "_id": "665f1c2a9b1e4a0012a34567",
  "title": "Community Cleanup Drive",
  "type": "Cleanup",
  "date": "2026-12-05",
  "location": "Dhanmondi Lake, Dhaka",
  "thumbnail": "https://example.com/cleanup.jpg",
  "description": "Join volunteers to clean the lakeside area.",
  "email": "organizer@example.com"
}
```

**Invalid ObjectId:**

```json
{
  "message": "Invalid event id"
}
```

**Event not found:**

```json
{
  "message": "Event not found"
}
```

#### `POST /add-event`

Creates an event. The request body must include `title` and `date`. The `_id` field is stripped if supplied by the client.

**Request:**

```http
POST /add-event
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "title": "Winter Clothes Distribution",
  "type": "Donation",
  "date": "2026-12-15",
  "location": "Mirpur 10, Dhaka",
  "thumbnail": "https://example.com/winter-drive.jpg",
  "description": "Collecting and distributing winter clothes for families in need.",
  "email": "organizer@example.com"
}
```

**Response:**

```json
{
  "acknowledged": true,
  "insertedId": "665f1c2a9b1e4a0012a34567"
}
```

**Validation error:**

```json
{
  "message": "Title and date are required"
}
```

#### `PATCH /events/:id`

Updates an event using MongoDB `$set`. The request body must contain at least one field. The `_id` field is stripped if supplied by the client.

**Request:**

```http
PATCH /events/665f1c2a9b1e4a0012a34567
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "title": "Updated Community Cleanup Drive",
  "location": "Hatirjheel, Dhaka"
}
```

**Response:**

```json
{
  "acknowledged": true,
  "modifiedCount": 1,
  "upsertedId": null,
  "upsertedCount": 0,
  "matchedCount": 1
}
```

**Validation error:**

```json
{
  "message": "No fields to update"
}
```

#### `DELETE /events/:id`

Deletes an event by ObjectId.

**Request:**

```http
DELETE /events/665f1c2a9b1e4a0012a34567
Authorization: Bearer <jwt>
```

**Response:**

```json
{
  "acknowledged": true,
  "deletedCount": 1
}
```

#### `GET /events/user/:email`

Returns events whose `email` field matches the URL-encoded email address.

**Request:**

```http
GET /events/user/organizer%40example.com
Authorization: Bearer <jwt>
```

**Response:**

```json
[
  {
    "_id": "665f1c2a9b1e4a0012a34567",
    "title": "Community Cleanup Drive",
    "type": "Cleanup",
    "date": "2026-12-05",
    "location": "Dhanmondi Lake, Dhaka",
    "thumbnail": "https://example.com/cleanup.jpg",
    "description": "Join volunteers to clean the lakeside area.",
    "email": "organizer@example.com"
  }
]
```

### Joined Events

#### `POST /joined`

Records an event participation. The request body must include `email` and `id`. The `_id` field is stripped if supplied by the client. The frontend sends the participant details together with a copy of the event data.

**Request:**

```http
POST /joined
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "id": "665f1c2a9b1e4a0012a34567",
  "title": "Community Cleanup Drive",
  "type": "Cleanup",
  "date": "2026-12-05",
  "location": "Dhanmondi Lake, Dhaka",
  "thumbnail": "https://example.com/cleanup.jpg",
  "description": "Join volunteers to clean the lakeside area.",
  "organizerName": "TogetherWe",
  "organizerEmail": "organizer@example.com",
  "organizerImage": "https://example.com/organizer.jpg"
}
```

**Response:**

```json
{
  "acknowledged": true,
  "insertedId": "665f1c2a9b1e4a0012a99999"
}
```

**Validation error:**

```json
{
  "message": "Email and event id are required"
}
```

#### `GET /joined/:email`

Returns joined-event records for the URL-encoded email address.

**Request:**

```http
GET /joined/jane%40example.com
Authorization: Bearer <jwt>
```

**Response:**

```json
[
  {
    "_id": "665f1c2a9b1e4a0012a99999",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "id": "665f1c2a9b1e4a0012a34567",
    "title": "Community Cleanup Drive",
    "type": "Cleanup",
    "date": "2026-12-05",
    "location": "Dhanmondi Lake, Dhaka",
    "thumbnail": "https://example.com/cleanup.jpg",
    "description": "Join volunteers to clean the lakeside area.",
    "organizerName": "TogetherWe",
    "organizerEmail": "organizer@example.com",
    "organizerImage": "https://example.com/organizer.jpg"
  }
]
```

#### `DELETE /joined/:id`

Deletes a joined-event record by the joined document's `_id`, not the event's `id`.

**Request:**

```http
DELETE /joined/665f1c2a9b1e4a0012a99999
Authorization: Bearer <jwt>
```

**Response:**

```json
{
  "acknowledged": true,
  "deletedCount": 1
}
```

### Error Responses

| Status | When | Example body |
| --- | --- | --- |
| `400` | Invalid JSON body | `{"message":"Invalid JSON body"}` |
| `400` | Invalid ObjectId | `{"message":"Invalid event id"}` or `{"message":"Invalid joined event id"}` |
| `400` | Missing required fields | `{"message":"Title and date are required"}` |
| `400` | Empty update body | `{"message":"No fields to update"}` |
| `401` | Missing, malformed, expired, or invalid JWT | `{"msg":"Unauthorized","message":"Unauthorized"}` |
| `404` | Unknown route | `{"message":"Not found"}` |
| `404` | Event not found | `{"message":"Event not found"}` |
| `500` | Unhandled database or server error | `{"message":"Internal server error"}` |
| `503` | Missing/invalid auth configuration | `{"msg":"Auth is not configured","message":"Auth is not configured"}` |
| `503` | JWKS retrieval or verification unavailable | `{"msg":"Auth temporarily unavailable","message":"Auth temporarily unavailable"}` |

## MongoDB Database and Collections

### Database

The API uses the `togetherWe` database.

### `events`

| Field | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | MongoDB document identifier |
| `title` | string | Event title |
| `type` | string | Event category, such as `Donation`, `Cleanup`, or `Plantation` |
| `date` | string | Event date in `YYYY-MM-DD` format |
| `location` | string | Event venue or location |
| `thumbnail` | string | Event image URL |
| `description` | string | Event description |
| `email` | string | Organizer email |

### `joinedEvents`

| Field | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Joined-record identifier |
| `name` | string | Participant name |
| `email` | string | Participant email |
| `id` | string | Event ObjectId stored as a string |
| `title` | string | Event title copied at join time |
| `type` | string | Event category copied at join time |
| `date` | string | Event date copied at join time |
| `location` | string | Event location copied at join time |
| `thumbnail` | string | Event thumbnail URL copied at join time |
| `description` | string | Event description copied at join time |
| `organizerName` | string | Organizer name, which may be empty |
| `organizerEmail` | string | Organizer email, which may be empty |
| `organizerImage` | string | Organizer image URL, which may be empty |

### Indexes

The server creates these indexes on first successful connection:

| Collection | Index |
| --- | --- |
| `events` | `{ date: 1 }` |
| `events` | `{ email: 1 }` |
| `joinedEvents` | `{ email: 1 }` |

### Connection Lifecycle

The MongoDB client is created once at module scope. The first database request calls `connectToMongoDB()`, which:

- Creates a single cached connection promise shared by concurrent requests.
- Reuses the connection across warm serverless invocations.
- Retries on the next request after a failed connection.
- Creates the supporting indexes after connecting.
- Uses these connection settings:

| Option | Value |
| --- | --- |
| `maxPoolSize` | `10` |
| `minPoolSize` | `0` |
| `maxIdleTimeMS` | `60000` |
| `serverSelectionTimeoutMS` | `8000` |
| `connectTimeoutMS` | `8000` |
| `waitQueueTimeoutMS` | `10000` |
| `appName` | `togetherwe-server` |

### Date Filtering

Event dates are stored as `YYYY-MM-DD` strings. The API compares them against the current date in the `Asia/Dhaka` timezone using MongoDB's `$gte` operator, then sorts by `date` in ascending order.

### Better Auth Collections

The frontend's Better Auth configuration uses the same `togetherWe` database for its authentication data. Those collections are managed by Better Auth in the frontend repository; the backend reads only `events` and `joinedEvents`.

## Authentication Middleware

The `verifyToken` middleware protects authenticated routes.

1. It reads the `Authorization` header and expects the format:

   ```http
   Authorization: Bearer <jwt>
   ```

2. It verifies the token with `jose`'s `jwtVerify` against a remote JWKS document.

3. The JWKS URL is:

   ```text
   ${CLIENT_URL}/api/auth/jwks
   ```

4. The JWKS resolver is created once at module scope and cached with:

   | Option | Value |
   | --- | --- |
   | `timeoutDuration` | `5000` ms |
   | `cooldownDuration` | `30000` ms |
   | `cacheMaxAge` | `600000` ms |

5. On success, the middleware calls `next()`.

6. On failure, it returns a JSON response:

   - `401` for missing, malformed, expired, or invalid tokens.
   - `503` when authentication configuration is missing or JWKS retrieval is unavailable.

JWTs are issued by Better Auth on the frontend. The backend does not issue tokens.

## Development Commands

| Command | Description |
| --- | --- |
| `npm install` | Install dependencies |
| `node index.js` | Start the API locally on port `8000` or the configured `PORT` |
| `node --check index.js` | Check JavaScript syntax |
| `npm test` | Placeholder script; no test suite is configured |
| `npx vercel dev` | Run the application with the Vercel CLI |
| `npx vercel --prod` | Deploy to Vercel Production |

`app.listen()` runs only when `process.env.VERCEL` is not set. On Vercel, the application is served through its default Express export.

## Deployment Instructions

### Vercel

1. Import the `togetherWe-server` repository into Vercel.
2. Keep the root directory as the repository root.
3. Vercel detects the Express application from `index.js`; no custom build command or output directory is required.
4. Set the Node.js version to 20.19 or newer.
5. Add the environment variables from [Environment Variables](#environment-variables) for the Production environment. Add them to Preview as well if preview deployments need API access.
6. Deploy the application.

### Production configuration notes

- Set `MONGODB_URL` to the production Atlas connection string.
- Set `CLIENT_URL` to the deployed frontend URL, for example `https://your-frontend-domain.vercel.app`.
- `CLIENT_URL` must be publicly reachable and must serve `/api/auth/jwks`.
- Do not use `http://localhost:3000` as `CLIENT_URL` in production.
- Set the Vercel Function region close to the MongoDB Atlas cluster region to reduce query latency.
- Ensure the MongoDB Atlas network access list allows the Vercel deployment environment.
- Fluid Compute is recommended for concurrent request handling.
- Set the frontend's `NEXT_PUBLIC_API_URL` to this backend deployment URL. Redeploy the frontend after changing that value because it is embedded at build time.
- Verify the deployment with:

  ```bash
  curl https://your-backend-domain.vercel.app/
  ```

  Expected response:

  ```json
  {
    "message": "server is running fine"
  }
  ```
