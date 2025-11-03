# Faculty Credit System API - v1

This document outlines the API endpoints for the Faculty Credit System.

## Base URL

The base URL for all API endpoints is configured via the `NEXT_PUBLIC_API_BASE_URL` environment variable.
Default: `https://faculty-credit-system.vercel.app`

---

## Authentication

### Register

- **Endpoint:** `POST /api/v1/auth/register`
- **Description:** Registers a new faculty member.
- **Request Body:**
  ```json
  {
    "name": "Dr. Alice",
    "email": "alice@example.com",
    "password": "Password123!",
    "college": "Engineering College"
  }
  ```

### Login

- **Endpoint:** `POST /api/v1/auth/login`
- **Description:** Authenticates a user and returns a token.
- **Request Body:**
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```

### Refresh Token

- **Endpoint:** `GET /api/v1/auth/refresh`
- **Description:** Refreshes an existing authentication token.
- **Headers:** `{ "Authorization": "Bearer {{token}}" }`

---

## Users

### Get My Profile

- **Endpoint:** `GET /api/v1/users/me`
- **Description:** Fetches the profile of the currently authenticated user.
- **Headers:** `{ "Authorization": "Bearer {{token}}" }`

### Admin: Create User

- **Endpoint:** `POST /api/v1/users`
- **Description:** Allows an admin to create a new user account.
- **Headers:** `{ "Authorization": "Bearer {{adminToken}}" }`
- **Request Body:**
  ```json
  {
    "name": "Prof. Bob",
    "email": "bob@example.com",
    "password": "AdminPass123#",
    "college": "Arts and Science College",
    "role": "faculty"
  }
  ```

### Admin: List Users

- **Endpoint:** `GET /api/v1/users`
- **Description:** Fetches a paginated list of all users.
- **Headers:** `{ "Authorization": "Bearer {{adminToken}}" }`
- **Query Parameters:** `page`, `limit`

---

## Credits

### Faculty: Submit Positive Credit

- **Endpoint:** `POST /api/v1/credits/positive`
- **Description:** Allows a faculty member to submit an achievement for credit.
- **Headers:** `{ "Authorization": "Bearer {{token}}" }`
- **Body (form-data):**
  - `title` (string)
  - `points` (number)
  - `academicYear` (string)
  - `proof` (file)

### Admin: Issue Negative Credit

- **Endpoint:** `POST /api/v1/admin/negative-credit`
- **Description:** Allows an admin to issue a negative credit to a faculty member.
- **Headers:** `{ "Authorization": "Bearer {{adminToken}}" }`
- **Body (form-data):**
  - `facultyId` (string)
  - `title` (string)
  - `points` (number)
  - `academicYear` (string)
  - `notes` (string)
  - `proof` (file)

### Faculty: Appeal Negative Credit

- **Endpoint:** `POST /api/v1/credits/{creditId}/appeal`
- **Description:** Allows a faculty member to appeal a negative credit.
- **Headers:** `{ "Authorization": "Bearer {{token}}" }`
- **Request Body:**
  ```json
  {
    "reason": "I have valid evidence attached; request review"
  }
  ```

### List Credits for a Faculty

- **Endpoint:** `GET /api/v1/credits/faculty/{facultyId}`
- **Description:** Fetches a paginated list of credits for a specific faculty member.
- **Headers:** `{ "Authorization": "Bearer {{token}}" }`
- **Query Parameters:** `page`, `limit`

---

## Admin: Credit Titles

### Admin: Create Credit Title

- **Endpoint:** `POST /api/v1/admin/credit-title`
- **Description:** Allows an admin to create a new type of credit.
- **Headers:** `{ "Authorization": "Bearer {{adminToken}}" }`
- **Request Body:**
  ```json
  {
    "title": "Conference Presentation",
    "points": 3,
    "description": "Presentation at a recognized conference"
  }
  ```

### Admin: List Credit Titles

- **Endpoint:** `GET /api/v1/admin/credit-title`
- **Description:** Fetches all available credit titles.
- **Headers:** `{ "Authorization": "Bearer {{adminToken}}" }`
