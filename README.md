# social-media-likes

Likes module and supporting API for a social media feed, built with **Next.js App Router**, **MongoDB**, and **Axios**.  
---

## 1. Overview 

- **What this module does**  
  Provides like/unlike functionality for posts with optimistic UI updates, periodic background refresh, and a MongoDB-backed API.

- **Key design points**  
  - **Optimistic UI**: 
  - **Polling / SSE ready**:
  - **Server as source of truth**:
  - **MongoDB**:

---

## 2. Tech Stack 

- **Runtime / Framework**
  - **Next.js** (App Router, version `15.x`)
  - **React** `19.x`
- **Database**
  - **MongoDB** (official Node.js driver)
- **Auth & Security**
  - **JWT** (`jsonwebtoken`) stored in an `HttpOnly` cookie (`social_token`)
- **Client utilities**
  - **Axios** for HTTP calls
  - **React Hook Form**, **Zod** for forms & validation
- **Styling & UI**
  - **Tailwind CSS**
  - **Radix UI** + custom components (`src/components/ui/*`)

---

## 3. Project Structure  (High Level)

- **`src/app`**
  - **`(auth)/login`**: Login page
  - **`(auth)/register`**: Registration page
  - **`(protected)/feed`**: Main social feed (shows posts & like buttons)
  - **`(protected)/bookmarks`**, **`(protected)/profile`**
  - **`api/likes/route.ts`**: Likes API (GET + POST)
  - **`api/auth/*`**: Auth APIs (login/register/logout)
- **`src/components`**
  - **`post-card.tsx`**: Post card UI including the like button and like count
  - **`protected-navbar.tsx`**, `ui/*`: Reusable UI components
- **`src/services`**
  - **`like.service.ts`**: Client-side likes service (Axios-based)
  - **`auth.service.ts`**, `index.ts`
- **`src/lib`**
  - **`db.ts`**: MongoDB connection helper
  - **`utils.ts`**: Utility helpers

---

## 4. Getting Started 

### 4.1 Requirements 

- **Node.js**:  
- **npm**
- **MongoDB**
### 4.2 Installation 

- **Clone the repo **

```bash
git clone <your-repo-url> social-media-likes
cd social-media-likes
```

- **Install dependencies **

```bash
npm install
```

### 4.3 Environment variables

Create a `.env.local` file in the project root and add:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db-name>
JWT_SECRET=your_jwt_secret_key
```

- **`MONGODB_URI`**: Your MongoDB connection string  
- **`JWT_SECRET`**: Secret key for signing JWT tokens used in `social_token` cookie

### 4.4 Running the app

- **Development**

```bash
npm run dev
```

App will run on `http://localhost:3000`.

- **Production build **

```bash
npm run build
npm start
```

---

## 5. Likes Module – Conceptual Overview

- **Core behavior**
  - Authenticated users can **toggle like/unlike** on posts.
  - UI updates immediately (optimistic), then reconciles with the server.
  - A background **polling** mechanism (e.g. every 2 seconds) keeps counts fresh.
  - Data is stored in a MongoDB `likes` collection with one document per `(postId, userId)`.

- **Non-goals **
  - No multi-reaction support (only binary like/unlike).
  - No complex analytics or detailed like history beyond `createdAt`.

---

## 6. Client Implementation

### 6.1 `PostCard` component

- **State**
  - **`likeCount: number`** – current displayed like count  
  - **`liked: boolean`** – whether the logged-in user has liked the post  
  - **`isLiking: boolean`** – prevents duplicate toggle requests

- **Lifecycle: initial load + polling **
  - On mount, call **`getLikeStateService(post.id)`** to fetch `{ likesCount, liked }`.
  - Set `likeCount` and `liked` from the response.
  - Start a polling interval (e.g. `setInterval` every `2000ms`) calling `getLikeStateService` again.
  - On unmount, clear the interval.

### 6.2 `handleLikeToggle` (optimistic UI flow)

1. If `isLiking === true`, return early (ignore double clicks).  
2. Store `previousLiked` and `previousCount`.  
3. Compute `nextLiked = !previousLiked`.  
4. Set `isLiking = true`.  
5. **Optimistic update**:
   - `setLiked(nextLiked)`
   - `setLikeCount(prev => Math.max(0, prev + (nextLiked ? 1 : -1)))`
6. Call `toggleLikeService(post.id)`.
7. On response:
   - **401 Unauthorized**: revert to previous state, show toast "Login to like this post", redirect to `/login`.
   - **Other errors**: revert optimistic update, show generic error toast.
   - **Success**: set `liked` and `likeCount` to **server returned** values.
8. Finally, set `isLiking = false`.

### 6.3 UI & Accessibility

- **Button state**
  - Disabled while `isLiking` is `true`.
  - Different visual styles for liked vs unliked (color, filled icon).
- **Accessibility**
  - `aria-pressed={liked}`  
  - `aria-label` describes action: `"Like post"` or `"Unlike post"`.
  - Keyboard: **Enter/Space** toggles the like state.

---

## 7. Client Service Layer (`like.service.ts`)

- **ServiceResult type**

```ts
interface ServiceResult<T> {
  success: boolean;
  status?: number;
  message?: string;
  data?: T;
}
```

- **`getLikeStateService(postId: string)`**
  - HTTP: `GET /api/likes?postId=${postId}`
  - On success: returns `{ likesCount, liked }` in `data`.
  - On Axios error: returns `success: false`, with `status` and `message`.

- **`toggleLikeService(postId: string)`**
  - HTTP: `POST /api/likes` with JSON body `{ postId }`.
  - Requires cookie auth; if server returns `401`, that status is returned for client to handle.
  - On success: returns `{ liked, likesCount }`.

- **Error handling conventions / एरर हैंडलिंग**
  - **401** → special handling on client (redirect to login).  
  - **400 / 422** → invalid input, show user-friendly message.  
  - **5xx** → transient server error; show generic error, rely on polling for eventual consistency.

---

## 8. Server API (`src/app/api/likes/route.ts`)

### 8.1 Helpers 

- **`getUserIdFromRequest(request: NextRequest): string | null`**
  - Reads `social_token` cookie.
  - Verifies JWT using `JWT_SECRET`.
  - Returns `decoded.sub` (user id) or `null`.

- **`getDb()`**
  - Returns a connected MongoDB database instance.

- **`getLikeState(postId: string, userId: string | null)`**
  - Returns `{ likesCount, liked }` for a given post and optional user.

### 8.2 `GET /api/likes`

- **Query params**
  - `postId=<string>` (required)  
  - `stream=1` (optional, reserved for SSE)

- **Validation**
  - If `postId` is missing or invalid → return **400**.

- **Behavior**
  - Extract `userId` from JWT (optional).
  - Call `getLikeState(postId, userId)`.
  - Return **200** with JSON:

```json
{
  "likesCount": 10,
  "liked": true
}
```

- **SSE support**
  - If `stream=1`, the endpoint can be adapted to serve **Server-Sent Events (SSE)** to push live updates.  
    (Requires long-lived HTTP connections and careful resource handling.)

### 8.3 `POST /api/likes`

- **Request body**

```json
{
  "postId": "123"
}
```

- **Auth**
  - Requires a valid `social_token` cookie.
  - If no valid user → **401 Unauthorized**.

- **Behavior**
  1. Connect to DB and `likes` collection.
  2. `existing = likesCollection.findOne({ postId, userId })`.
  3. If **existing like found**:
     - `deleteOne({ _id: existing._id })` → `liked = false`.
  4. Else:
     - `insertOne({ postId, userId, createdAt: new Date() })` → `liked = true`.
  5. Recompute `likesCount = countDocuments({ postId })`.
  6. Return **200** with:

```json
{
  "liked": true,
  "likesCount": 11
}
```

- **Idempotency / Concurrency**
  - For this simple toggle, `findOne + insertOne/deleteOne` is acceptable.
  - At higher concurrency, prefer a **unique compound index** and possibly an upsert-based pattern.

---

## 9. Database Schema

- **Collection: `likes`**

```json
{
  "_id": "ObjectId",
  "postId": "string",
  "userId": "string",
  "createdAt": "ISODate"
}
```

- **Indexes**
  - **Unique compound index**: `{ postId: 1, userId: 1 }` with `unique: true`  
    - Prevents duplicate likes for the same `(postId, userId)`.
  - **Secondary index**: `{ postId: 1 }`  
    - Speeds up `countDocuments({ postId })` and aggregations.

- **Scaling note**
  - For millions of likes, `countDocuments` may become slow.  
  - Consider a denormalized `posts.likesCount` counter with atomic increment/decrement or an aggregation pipeline with precomputed counters.

---

## 10. Security & Validation

- **Input validation**
  - Validate `postId` on all endpoints using **Zod** or similar.
- **Auth**
  - Only allow `POST /api/likes` for authenticated users (JWT in `social_token` cookie).
- **Sanitization**
  - Always pass values as parameters to the MongoDB driver; avoid string concatenation to prevent injection.
- **Cookie security**
  - Use `HttpOnly`, `Secure`, and appropriate `SameSite` flags for `social_token`.

---

## 11. Edge Cases

- **Rapid toggles / double clicks**
  - Guarded by `isLiking` on the client.
  - Server-side, use unique indexes to avoid duplicate likes.
- **Race conditions**
  - If multiple toggles race, final server state is authoritative.
  - Client reconciles with server response or next poll.
- **Unauthenticated user**
  - `GET` shows counts.
  - `POST` returns **401** → client reverts UI and redirects to login.
- **Network failures**
  - Revert optimistic changes, show toast.
  - Periodic polling will eventually correct the UI.
- **Missing or invalid `postId`**
  - Return **400** with error details.

---

## 12. Testing & Observability

- **Unit tests**
  - Service functions (mock Axios).
  - API handlers (mock DB & JWT).
- **Integration tests**
  - Simulate like/unlike flows with a test DB or in-memory Mongo.
- **E2E tests**
  - Validate `PostCard` behavior: optimistic update, rollback on error, redirect on 401.
- **Metrics & logging**
  - Count of successful vs failed `POST /api/likes` calls.
  - DB operation latency.
  - Growth of `likes` collection and index performance.

---

## 13. Future Improvements

- **Multi-reaction support** (❤️, 👍, 😮, etc.)  
- **Real-time updates** using SSE or WebSockets instead of polling.  
- **Denormalized counters** in a `posts` collection for faster feeds.  
- **Admin analytics dashboard** for monitoring engagement.

---
