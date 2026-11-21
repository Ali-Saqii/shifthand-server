# ShiftHand Frontend API Integration

This document describes the live API routes currently implemented in the repository.

## Live base URL

```text
https://shifthand-server-production.up.railway.app
```

Use the versioned `/api/v1` routes for new frontend integrations. Original unversioned routes remain available for compatibility.

## Common response formats

Successful data responses:

```json
{
  "data": {}
}
```

Successful list responses with cursor pagination:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "cursor-string-or-null"
  }
}
```

Error response:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Common headers:

```http
Content-Type: application/json
Authorization: Bearer <access-token>
X-Org-Id: <organization-id>
```

`Authorization` is required for staff routes. `X-Org-Id` is optional, but it must match the organisation route if supplied.

## Health

| Method | URL | Body |
| --- | --- | --- |
| GET | `/health` | None |
| GET | `/healthz` | None |
| GET | `/api/v1/healthz` | None |

Example:

```http
GET /api/v1/healthz
```

Response:

```json
{
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

## Authentication

### Register staff/user

```http
POST /api/v1/auth/register
```

Body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "StrongPassword123!",
  "phone": "+919876543210"
}
```

Password: 8–72 characters.

Success:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+919876543210"
    },
    "accessToken": "jwt",
    "refreshToken": "random-refresh-token"
  }
}
```

### Login

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "test@example.com",
  "password": "StrongPassword123!"
}
```

### Refresh access token

```http
POST /api/v1/auth/refresh
```

Body:

```json
{
  "refreshToken": "<refresh-token>"
}
```

### Current staff user

```http
GET /api/v1/auth/me
Authorization: Bearer <access-token>
```

The compatibility route is:

```http
GET /api/v1/me
Authorization: Bearer <access-token>
```

## Organisations

All routes below require:

```http
Authorization: Bearer <access-token>
```

### Create organisation

```http
POST /api/v1/orgs
```

Body:

```json
{
  "name": "Test Organisation",
  "timezone": "Asia/Kolkata"
}
```

The creator becomes the organisation owner.

### List organisations

```http
GET /api/v1/orgs
```

### List organisation members

Owner/coordinator only:

```http
GET /api/v1/orgs/{organizationId}/members
X-Org-Id: {organizationId}
```

### Add registered staff member

Owner/coordinator only:

```http
POST /api/v1/orgs/{organizationId}/members
X-Org-Id: {organizationId}
```

Body:

```json
{
  "email": "staff@example.com",
  "role": "coordinator"
}
```

Allowed roles:

```text
coordinator
shift_lead
```

### Create staff invitation

Owner/coordinator only:

```http
POST /api/v1/orgs/{organizationId}/invites
X-Org-Id: {organizationId}
```

Body:

```json
{
  "email": "staff@example.com",
  "role": "coordinator"
}
```

The accepted role is `coordinator` or `shift_lead`.

### Accept staff invitation

The logged-in user's email must match the invite email.

```http
POST /api/v1/orgs/{organizationId}/invites/accept
X-Org-Id: {organizationId}
```

Body:

```json
{
  "code": "A1B2C3D4"
}
```

The code is 8 characters containing uppercase letters and digits.

### Update member role

Owner/coordinator only:

```http
PATCH /api/v1/orgs/{organizationId}/members/{userId}
X-Org-Id: {organizationId}
```

Body:

```json
{
  "role": "coordinator"
}
```

Allowed roles:

```text
owner
coordinator
shift_lead
```

### Remove member

Owner/coordinator only:

```http
DELETE /api/v1/orgs/{organizationId}/members/{userId}
X-Org-Id: {organizationId}
```

Success: `204 No Content`.

## Events

All staff event routes require:

```http
Authorization: Bearer <access-token>
X-Org-Id: {organizationId}
```

### Create event

```http
POST /api/v1/orgs/{organizationId}/events
```

Body:

```json
{
  "title": "Community Food Drive",
  "description": "Volunteer food collection",
  "location": "Community Hall",
  "startsAt": "2026-11-20T09:00:00.000Z",
  "endsAt": "2026-11-20T17:00:00.000Z"
}
```

### List events

```http
GET /api/v1/orgs/{organizationId}/events?limit=20
```

Optional query:

```text
cursor=<nextCursor>
limit=1-100
```

### Get event

```http
GET /api/v1/orgs/{organizationId}/events/{eventId}
```

### Update event

```http
PATCH /api/v1/orgs/{organizationId}/events/{eventId}
```

Body:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "location": "Updated location",
  "startsAt": "2026-11-20T09:30:00.000Z",
  "endsAt": "2026-11-20T17:30:00.000Z"
}
```

### Publish event

```http
POST /api/v1/orgs/{organizationId}/events/{eventId}/publish
```

Empty body is not required. Send `{}` when using a strict HTTP client.

### Cancel event

```http
POST /api/v1/orgs/{organizationId}/events/{eventId}/cancel
```

Empty body or `{}`.

### Delete event

```http
DELETE /api/v1/orgs/{organizationId}/events/{eventId}
```

Success: `204 No Content`.

### Public event JSON

No authentication:

```http
GET /api/v1/public/events/{publicSlug}
```

Only published events are returned.

### Public event HTML page

No authentication:

```http
GET /e/{publicSlug}
```

Versioned compatibility route:

```http
GET /api/v1/e/{publicSlug}
```

## Shifts

Staff shift routes require:

```http
Authorization: Bearer <access-token>
X-Org-Id: {organizationId}
```

### Create shift

```http
POST /api/v1/events/{eventId}
```

Body:

```json
{
  "title": "Morning Setup",
  "roleLabel": "Setup crew",
  "startsAt": "2026-11-20T09:00:00.000Z",
  "endsAt": "2026-11-20T12:00:00.000Z",
  "capacity": 10,
  "cancelCutoffHours": 24,
  "leadUserId": null,
  "notes": "Meet at reception"
}
```

### List shifts

```http
GET /api/v1/events/{eventId}
```

Shift leads receive only shifts assigned to them.

### Get shift

```http
GET /api/v1/events/{eventId}/{shiftId}
```

### Update shift

```http
PATCH /api/v1/events/{eventId}/{shiftId}
```

Body:

```json
{
  "title": "Updated Setup",
  "startsAt": "2026-11-20T09:30:00.000Z",
  "endsAt": "2026-11-20T12:30:00.000Z",
  "capacity": 12,
  "confirmChange": true
}
```

`confirmChange: true` is required for risky changes when active signups exist.

### Cancel shift

```http
POST /api/v1/events/{eventId}/{shiftId}/cancel
```

Body:

```json
{
  "confirmChange": true
}
```

Legacy delete route:

```http
DELETE /api/v1/events/{eventId}/{shiftId}
```

This cancels the shift; it does not delete it.

## Staff signups

Staff signup routes require:

```http
Authorization: Bearer <access-token>
X-Org-Id: {organizationId}
```

### List shift signups

```http
GET /api/v1/shifts/{shiftId}
```

### Create authenticated staff signup

```http
POST /api/v1/shifts/{shiftId}
```

Send an empty JSON body:

```json
{}
```

### Remove authenticated staff signup

```http
DELETE /api/v1/shifts/{shiftId}
```

## Devices

Requires staff authentication:

```http
Authorization: Bearer <access-token>
```

### Register device

```http
POST /api/v1/devices
```

Body:

```json
{
  "token": "<APNs-or-FCM-device-token>",
  "platform": "ios"
}
```

Platform values:

```text
ios
android
```

### Remove device

```http
DELETE /api/v1/devices
```

Body:

```json
{
  "token": "<device-token>"
}
```

## Public volunteer access

These routes do not require staff authentication.

### Request access email

```http
POST /api/v1/public/orgs/{organizationId}/access
```

Body:

```json
{
  "name": "Test Volunteer",
  "email": "volunteer@example.com",
  "phone": "+919876543210",
  "consent": true,
  "honeypot": ""
}
```

`consent` must be `true`. `honeypot` must be empty.

The response is intentionally uniform:

```json
{
  "data": {
    "message": "If the email is eligible, an access link will be sent."
  }
}
```

Compatibility routes:

```http
POST /public/orgs/{organizationId}/access
```

### Verify volunteer access token

The token is a 64-character lowercase hexadecimal value received by email.

```http
GET /api/v1/public/access/{token}
```

Compatibility routes:

```http
GET /public/access/{token}
GET /v/access/{token}
```

Success:

```json
{
  "data": {
    "volunteer": {
      "id": "uuid",
      "organizationId": "uuid",
      "name": "Test Volunteer",
      "email": "volunteer@example.com"
    },
    "expiresAt": "2026-11-20T12:30:00.000Z"
  }
}
```

## Day 10 public volunteer signup

This route does not use staff authentication.

```http
POST /api/v1/public/shifts/{shiftId}/signup
```

Headers:

```http
Content-Type: application/json
Idempotency-Key: unique-request-id
```

Body:

```json
{
  "accessToken": "<64-character-volunteer-access-token>"
}
```

The same `Idempotency-Key` and request returns the existing result. Reusing the key with a different request returns `409 IDEMPOTENCY_KEY_REUSED`.

Success status:

```text
201 Created — new signup
200 OK — duplicate/existing active signup
```

Example success:

```json
{
  "data": {
    "signup": {
      "id": "uuid",
      "shiftId": "uuid",
      "status": "unverified",
      "holdExpiresAt": "2026-11-20T12:30:00.000Z"
    },
    "reused": false
  }
}
```

## Validation and status codes

| Status | Meaning |
| --- | --- |
| 200 | Request succeeded |
| 201 | Resource created |
| 204 | Resource deleted or cancelled |
| 400 | Required header or malformed request |
| 401 | Invalid access token |
| 403 | Insufficient role or blocked volunteer |
| 404 | Resource not found or hidden by tenant isolation |
| 409 | Conflict, full shift, duplicate, or invalid lifecycle state |
| 422 | Request validation failed |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

Validation errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": "\"email\" must be a valid email"
      }
    }
  }
}
```

## Frontend integration rules

1. Use `/api/v1` routes for new integrations.
2. Store the access token in secure app storage.
3. Send `Authorization: Bearer <access-token>` for staff routes.
4. Send `X-Org-Id` consistently for organisation-scoped staff requests.
5. Never put staff access tokens in public/volunteer pages.
6. Regenerate or persist a unique `Idempotency-Key` for each volunteer signup attempt.
7. Do not expose `accessToken` in browser URLs. Keep it in request state or a secure cookie in a later implementation.
8. Send dates in ISO-8601 format.
9. Keep 422 field errors and display them next to the matching form field.
10. Treat `ORGANIZATION_NOT_FOUND` and `404` as hidden/not-found resources.

## Day 11 signup conflicts

A volunteer cannot hold two shifts whose time ranges overlap.

The overlap rule is:

```text
newStart < existingEnd && existingStart < newEnd
```

Back-to-back shifts are allowed when one ends exactly when the next begins.

Overlapping signup responses use:

```json
{
  "error": {
    "code": "SHIFT_OVERLAP",
    "message": "You are already signed up for an overlapping shift",
    "details": {
      "overlappingShiftId": "uuid"
    }
  }
}
```

## Volunteer portal

### Activate magic link

```http
GET /v/{64-character-token}
```

This validates the token, sets an HttpOnly signed `volunteerId` cookie and a
`volunteerCsrf` cookie, then redirects with `303` to:

```text
/v
```

### List My Shifts

Requires the signed volunteer cookie:

```http
GET /v
```

Response groups shifts into `upcoming`, `past`, and `cancelled`.

### Sign out

```http
POST /v/signout
```

### Cancel signup

Requires the signed volunteer cookie and CSRF header:

```http
POST /v/signups/{signupId}/cancel
X-CSRF-Token: <volunteerCsrf-cookie-value>
```

Cancellation is idempotent. `lateCancel` indicates whether the configured cutoff passed.

### Download private calendar

Requires the signed volunteer cookie:

```http
GET /v/signups/{signupId}/calendar
```

Returns `text/calendar` with a private `.ics` download.

### Resend volunteer access

```http
POST /api/v1/public/resend
```

Body:

```json
{
  "organizationId": "uuid",
  "email": "volunteer@example.com"
}
```

The known-email and unknown-email responses are intentionally identical.
