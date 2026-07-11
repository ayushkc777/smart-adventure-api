# Smart Adventure API

Backend REST API for a Nepal adventure tourism booking platform. It supports authentication, role-based access, activities, operators, bookings, reviews, wishlist, support messages, notifications, newsletter subscriptions, dashboard statistics, uploads, and seed data.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Multer uploads
- Helmet, CORS, Morgan
- express-validator
- ES Modules

## Installation

```bash
cd ~/Documents/smart-adventure-api
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

Create `.env` from `.env.example`.

```env
NODE_ENV=development
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/smart_adventure_booking
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_DIR=src/uploads
```

## Database

The API expects MongoDB to be available at `MONGO_URI`.

For a local machine, start MongoDB first, then run the API.

```bash
brew services start mongodb-community
npm run dev
```

## Seed Data

The seed command clears existing development data and creates:

- Admin account
- Demo user account
- Nepal adventure activities
- Licensed operators
- Reviews

```bash
npm run seed
```

Seed credentials:

```text
Admin: admin@smartadventure.com / Admin123
User: user@smartadventure.com / User1234
```

## Scripts

```bash
npm run dev     # Start development server with nodemon
npm start       # Start production-style server
npm run seed    # Seed MongoDB
npm run lint    # Run ESLint
npm run build   # Import-check application modules
```

## Main API Routes

Base URL:

```text
http://localhost:5050/api
```

### Health

```text
GET /api/health
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Users

```text
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
PATCH  /api/users/me
PATCH  /api/users/me/password
POST   /api/users/me/avatar
DELETE /api/users/me/avatar
```

Admin access is required for listing, viewing, updating, and deleting other users.

### Activities

```text
GET    /api/activities
GET    /api/activities/:idOrSlug
POST   /api/activities
PATCH  /api/activities/:id
DELETE /api/activities/:id
POST   /api/activities/:id/gallery
```

Admin access is required for create, update, delete, and gallery uploads.

### Operators

```text
GET    /api/operators
GET    /api/operators/:id
POST   /api/operators
PATCH  /api/operators/:id
DELETE /api/operators/:id
POST   /api/operators/:id/logo
```

Admin access is required for create, update, delete, and logo uploads.

### Bookings

```text
GET   /api/bookings
POST  /api/bookings
GET   /api/bookings/:id
PATCH /api/bookings/:id
PATCH /api/bookings/:id/cancel
PATCH /api/bookings/:id/status
DELETE /api/bookings/:id
```

Users can create and manage their own bookings. Admins can view all bookings and update statuses.

### Reviews

```text
GET    /api/reviews
POST   /api/reviews
PATCH  /api/reviews/:id
DELETE /api/reviews/:id
```

Activity ratings and review counts are recalculated when reviews change.

### Wishlist

```text
GET    /api/wishlist
POST   /api/wishlist/:activityId
DELETE /api/wishlist/:activityId
```

### Support

```text
POST  /api/support
GET   /api/support
GET   /api/support/:id
PATCH /api/support/:id
DELETE /api/support/:id
```

Admin access is required for listing and updating support messages.

### Notifications

```text
GET    /api/notifications
POST   /api/notifications
PATCH  /api/notifications/:id
DELETE /api/notifications/:id
```

Admin access is required for creating notifications.

### Newsletter

```text
POST   /api/newsletter
GET    /api/newsletter
DELETE /api/newsletter/:id
```

Admin access is required for listing and deleting subscriptions.

### Admin

```text
GET /api/admin/dashboard
GET /api/admin/analytics
```

Admin endpoints require a valid JWT for a user with role `admin`.

## Authentication

Login and register return a JWT in the JSON response and also set an HTTP-only cookie. Protected routes accept:

```text
Authorization: Bearer <token>
```

or the `token` cookie.

## Uploads

Uploaded files are stored under `src/uploads`.

Supported uploads:

- User avatar: `POST /api/users/me/avatar`
- User avatar removal: `DELETE /api/users/me/avatar`
- Activity gallery: `POST /api/activities/:id/gallery`
- Operator logo: `POST /api/operators/:id/logo`

Use multipart form data with field names `avatar`, `gallery`, and `logo`.

## Security Notes

- Passwords are hashed with bcrypt.
- JWT secrets are loaded from environment variables.
- Passwords are never returned in API responses.
- Helmet is enabled.
- CORS is restricted to `CLIENT_ORIGIN`.
- Admin-only routes are protected by role middleware.
- Authentication routes are rate limited to reduce brute-force attempts.
- Uploaded images are checked by extension, MIME type, file size, and detected file signature.

## Delete Safety

The API avoids hard-deleting records when doing so could leave orphaned operational data.

- Activities with bookings, reviews, or wishlist references are archived instead of deleted.
- Operators with bookings, reviews, or activity price references are marked inactive instead of deleted.
- Users with bookings, reviews, wishlists, or notifications are suspended instead of deleted.
- Admins cannot delete themselves, change their own role, suspend themselves, or remove the last active admin account.
- Bookings with confirmed or completed status should be cancelled instead of deleted.

## Folder Structure

```text
src/
  config/        Environment and MongoDB connection
  controllers/   Route handlers
  middleware/    Auth, validation, upload, rate limit, and error handling
  models/        Mongoose schemas
  routes/        Express route modules
  seed/          Development seed script
  services/      Shared domain services
  uploads/       Uploaded files and upload folder placeholders
  utils/         Shared helpers
  validators/    express-validator schemas
  app.js         Express app configuration
  server.js      Server startup
```
